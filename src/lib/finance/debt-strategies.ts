import type {
  Debt,
  DebtInputSnapshot,
  DebtPayoffLedgerEntry,
  DebtPayoffPlan,
  DebtPayoffStep,
} from "@/types/database";

interface DebtState {
  id: string;
  title: string;
  remaining: number;
  initialBalance: number;
  rate: number;
  minimum: number;
}

const MAX_SIMULATION_MONTHS = 600;
const MAX_BALANCE_MULTIPLIER = 50;
const PAYOFF_EPSILON = 0.01;

function monthlyRate(annualRatePercent: number): number {
  return annualRatePercent / 100 / 12;
}

function sortDebts(
  debts: DebtState[],
  strategy: "avalanche" | "snowball"
): DebtState[] {
  return [...debts].sort((a, b) => {
    if (strategy === "avalanche") return b.rate - a.rate;
    return a.remaining - b.remaining;
  });
}

interface PaymentResult {
  balanceBefore: number;
  interestAccrued: number;
  paymentToInterest: number;
  paymentToPrincipal: number;
  balanceAfter: number;
}

function applyPayment(
  debt: DebtState,
  payment: number
): PaymentResult {
  const balanceBefore = debt.remaining;
  const interestAccrued = balanceBefore * monthlyRate(debt.rate);
  const paymentToInterest = Math.min(payment, interestAccrued);
  const paymentToPrincipal = Math.min(
    Math.max(0, payment - paymentToInterest),
    balanceBefore
  );
  const unpaidInterest = interestAccrued - paymentToInterest;

  debt.remaining = balanceBefore - paymentToPrincipal + unpaidInterest;

  return {
    balanceBefore,
    interestAccrued,
    paymentToInterest,
    paymentToPrincipal,
    balanceAfter: debt.remaining,
  };
}

function buildInputSnapshot(debts: Debt[]): DebtInputSnapshot[] {
  return debts.map((debt) => ({
    id: debt.id,
    title: debt.title,
    initialBalance: debt.remaining_amount,
    annualRatePercent: debt.interest_rate,
    monthlyRatePercent: monthlyRate(debt.interest_rate) * 100,
    minimumPayment: debt.minimum_payment,
    firstMonthInterest: Math.round(
      debt.remaining_amount * monthlyRate(debt.interest_rate)
    ),
  }));
}

function detectInputWarnings(snapshot: DebtInputSnapshot[]): string[] {
  const warnings: string[] = [];

  for (const debt of snapshot) {
    if (debt.minimumPayment + PAYOFF_EPSILON < debt.firstMonthInterest) {
      warnings.push(
        `«${debt.title}»: минимальный платёж (${debt.minimumPayment.toLocaleString("ru-RU")} ₽) меньше процентов за 1-й месяц (${debt.firstMonthInterest.toLocaleString("ru-RU")} ₽) — долг будет расти без доплат.`
      );
    }
    if (debt.annualRatePercent > 100) {
      warnings.push(
        `«${debt.title}»: ставка ${debt.annualRatePercent}% годовых — переплата растёт очень быстро.`
      );
    }
  }

  return warnings;
}

export function calculateDebtPayoff(
  debts: Debt[],
  extraPayment: number,
  strategy: "avalanche" | "snowball"
): DebtPayoffPlan {
  const inputSnapshot = buildInputSnapshot(debts);
  const inputWarnings = detectInputWarnings(inputSnapshot);

  if (debts.length === 0) {
    return {
      strategy,
      monthsToFreedom: 0,
      totalInterest: 0,
      totalPaid: 0,
      steps: [],
      ledger: [],
      inputSnapshot,
      extraPayment,
      warnings: inputWarnings,
      status: "complete",
    };
  }

  const states: DebtState[] = debts.map((debt) => ({
    id: debt.id,
    title: debt.title,
    remaining: debt.remaining_amount,
    initialBalance: debt.remaining_amount,
    rate: debt.interest_rate,
    minimum: debt.minimum_payment,
  }));

  const steps: DebtPayoffStep[] = [];
  const ledger: DebtPayoffLedgerEntry[] = [];
  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const warnings = [...inputWarnings];
  let status: DebtPayoffPlan["status"] = "complete";

  while (states.some((debt) => debt.remaining > PAYOFF_EPSILON)) {
    if (month >= MAX_SIMULATION_MONTHS) {
      status = "max_months_reached";
      warnings.push(
        `Расчёт остановлен на ${MAX_SIMULATION_MONTHS} мес. — при текущих платежах долг не погашается.`
      );
      break;
    }

    month++;

    for (const debt of states) {
      if (debt.remaining <= PAYOFF_EPSILON) continue;

      const payment = Math.min(debt.minimum, debt.remaining + debt.remaining * monthlyRate(debt.rate));
      const result = applyPayment(debt, payment);
      totalInterest += result.paymentToInterest;
      totalPaid += payment;

      steps.push({
        month,
        debtTitle: debt.title,
        payment,
        remaining: Math.max(0, debt.remaining),
        interestPaid: result.paymentToInterest,
      });

      ledger.push({
        month,
        debtTitle: debt.title,
        paymentType: "minimum",
        balanceBefore: result.balanceBefore,
        interestAccrued: result.interestAccrued,
        paymentTotal: payment,
        paymentToInterest: result.paymentToInterest,
        paymentToPrincipal: result.paymentToPrincipal,
        balanceAfter: result.balanceAfter,
      });

      if (debt.remaining > debt.initialBalance * MAX_BALANCE_MULTIPLIER) {
        status = "unpayable";
        warnings.push(
          `«${debt.title}»: остаток вырос более чем в ${MAX_BALANCE_MULTIPLIER}× — минимальные платежи не покрывают проценты.`
        );
        break;
      }
    }

    if (status === "unpayable") break;

    let budget = Math.max(0, extraPayment);
    const active = sortDebts(
      states.filter((debt) => debt.remaining > PAYOFF_EPSILON),
      strategy
    );

    for (const debt of active) {
      if (budget <= PAYOFF_EPSILON) break;

      const payment = Math.min(
        budget,
        debt.remaining + debt.remaining * monthlyRate(debt.rate)
      );
      const result = applyPayment(debt, payment);
      totalInterest += result.paymentToInterest;
      totalPaid += payment;
      budget -= payment;

      steps.push({
        month,
        debtTitle: debt.title,
        payment,
        remaining: Math.max(0, debt.remaining),
        interestPaid: result.paymentToInterest,
      });

      ledger.push({
        month,
        debtTitle: debt.title,
        paymentType: "extra",
        balanceBefore: result.balanceBefore,
        interestAccrued: result.interestAccrued,
        paymentTotal: payment,
        paymentToInterest: result.paymentToInterest,
        paymentToPrincipal: result.paymentToPrincipal,
        balanceAfter: result.balanceAfter,
      });

      if (debt.remaining > debt.initialBalance * MAX_BALANCE_MULTIPLIER) {
        status = "unpayable";
        warnings.push(
          `«${debt.title}»: остаток вырос более чем в ${MAX_BALANCE_MULTIPLIER}× — при такой ставке нужны большие доплаты.`
        );
        break;
      }
    }

    if (status === "unpayable") break;
  }

  return {
    strategy,
    monthsToFreedom: month,
    totalInterest: Math.round(totalInterest),
    totalPaid: Math.round(totalPaid),
    steps,
    ledger,
    inputSnapshot,
    extraPayment,
    warnings: [...new Set(warnings)],
    status,
  };
}

export function strategyLabel(strategy: "avalanche" | "snowball"): string {
  return strategy === "avalanche"
    ? "Лавина (высокая ставка)"
    : "Снежный ком (малый долг)";
}

export function buildStrategyComparison(
  avalanche: DebtPayoffPlan,
  snowball: DebtPayoffPlan
): string {
  if (avalanche.status === "unpayable" || snowball.status === "unpayable") {
    const broken = [avalanche, snowball].filter((plan) => plan.status === "unpayable");
    if (broken.length === 2) {
      return "Оба сценария непогашаемы при текущих платежах — увеличьте доплату или пересмотрите минимальные платежи.";
    }
    const viable = broken[0] === avalanche ? snowball : avalanche;
    return `${strategyLabel(viable.strategy)} остаётся рабочим сценарием; альтернатива даёт непогашаемый долг при текущих платежах.`;
  }

  if (avalanche.status !== "complete" || snowball.status !== "complete") {
    return "Сравнение ориентировочное: один из сценариев не успел полностью погасить долг в пределах расчёта.";
  }

  const interestDiff = Math.abs(avalanche.totalInterest - snowball.totalInterest);
  if (interestDiff < 1) {
    return "Переплата по процентам почти одинаковая — выбирайте метод, который проще соблюдать.";
  }

  const cheaper =
    avalanche.totalInterest <= snowball.totalInterest ? avalanche : snowball;
  const monthsDiff = Math.abs(
    avalanche.monthsToFreedom - snowball.monthsToFreedom
  );

  if (cheaper.strategy === "avalanche") {
    return `Лавина экономит ${interestDiff.toLocaleString("ru-RU")} ₽ процентов: сначала гасится долг с наивысшей ставкой (${describeTopRate(avalanche)}), поэтому переплата растёт медленнее.`;
  }

  return `Снежный ком переплачивает на ${interestDiff.toLocaleString("ru-RU")} ₽: пока гасится малый долг, высокоставочные продолжают начислять проценты (${describeTopRate(snowball)}). Сроки отличаются на ${monthsDiff} мес.`;
}

function describeTopRate(plan: DebtPayoffPlan): string {
  const top = [...plan.inputSnapshot].sort(
    (a, b) => b.annualRatePercent - a.annualRatePercent
  )[0];
  if (!top) return "высокая ставка";
  return `${top.annualRatePercent}% у «${top.title}»`;
}
