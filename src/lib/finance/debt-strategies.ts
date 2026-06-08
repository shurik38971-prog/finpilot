import {
  DEBT_TERM_MISSING_WARNING,
  getDebtMonthlyPayment,
  getDebtOverpayment,
  isDebtTermMissing,
} from "@/lib/finance/debt-payment";
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
  termMonths: number | null;
}

interface MonthlyPaymentResult {
  balanceBefore: number;
  interestAccrued: number;
  paymentTotal: number;
  paymentToInterest: number;
  paymentToPrincipal: number;
  balanceAfter: number;
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

/** One interest accrual per month; base + extra are a single payment. */
export function applyMonthlyPayment(
  openingBalance: number,
  totalPayment: number,
  annualRatePercent: number
): MonthlyPaymentResult {
  if (openingBalance <= PAYOFF_EPSILON) {
    return {
      balanceBefore: 0,
      interestAccrued: 0,
      paymentTotal: 0,
      paymentToInterest: 0,
      paymentToPrincipal: 0,
      balanceAfter: 0,
    };
  }

  const monthlyInterest = openingBalance * monthlyRate(annualRatePercent);
  const maxPayment = openingBalance + monthlyInterest;
  const paymentApplied = Math.min(Math.max(0, totalPayment), maxPayment);
  const paymentToInterest = Math.min(paymentApplied, monthlyInterest);
  const paymentToPrincipal = paymentApplied - paymentToInterest;
  const balanceAfter = openingBalance + monthlyInterest - paymentApplied;

  return {
    balanceBefore: openingBalance,
    interestAccrued: monthlyInterest,
    paymentTotal: paymentApplied,
    paymentToInterest,
    paymentToPrincipal,
    balanceAfter: Math.max(0, balanceAfter),
  };
}

function buildInputSnapshot(debts: Debt[]): DebtInputSnapshot[] {
  return debts.map((debt) => {
    const minimumPayment = getDebtMonthlyPayment(debt);
    return {
      id: debt.id,
      title: debt.title,
      initialBalance: debt.remaining_amount,
      annualRatePercent: debt.interest_rate,
      monthlyRatePercent: monthlyRate(debt.interest_rate) * 100,
      minimumPayment,
      firstMonthInterest: Math.round(
        debt.remaining_amount * monthlyRate(debt.interest_rate)
      ),
      termMonths: debt.term_months,
      paymentType: debt.payment_type ?? "annuity",
      overpayment: getDebtOverpayment(debt),
    };
  });
}

function detectInputWarnings(debts: Debt[], snapshot: DebtInputSnapshot[]): string[] {
  const warnings: string[] = [];

  for (let i = 0; i < snapshot.length; i++) {
    const debt = snapshot[i];
    const source = debts[i];

    if (source && isDebtTermMissing(source)) {
      warnings.push(`«${debt.title}»: ${DEBT_TERM_MISSING_WARNING}`);
    }

    if (debt.minimumPayment + PAYOFF_EPSILON < debt.firstMonthInterest) {
      warnings.push(
        `«${debt.title}»: ежемесячный платёж (${debt.minimumPayment.toLocaleString("ru-RU")} ₽) меньше процентов за 1-й месяц (${debt.firstMonthInterest.toLocaleString("ru-RU")} ₽) — долг будет расти без доплат.`
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

function simulationMonthLimit(states: DebtState[]): number {
  const terms = states
    .map((debt) => debt.termMonths)
    .filter((term): term is number => term !== null && term > 0);

  if (terms.length === 0) return MAX_SIMULATION_MONTHS;
  return Math.max(...terms) + 120;
}

function allocateMonthlyPayments(
  states: DebtState[],
  extraPayment: number,
  strategy: "avalanche" | "snowball"
): Map<string, number> {
  const payments = new Map<string, number>();
  const opening = new Map<string, number>();

  for (const debt of states) {
    if (debt.remaining <= PAYOFF_EPSILON) continue;
    payments.set(debt.id, debt.minimum);
    opening.set(debt.id, debt.remaining);
  }

  let extraBudget = Math.max(0, extraPayment);
  const active = sortDebts(
    states.filter((debt) => debt.remaining > PAYOFF_EPSILON),
    strategy
  );

  for (const debt of active) {
    if (extraBudget <= PAYOFF_EPSILON) break;

    const balance = opening.get(debt.id) ?? debt.remaining;
    const monthlyInterest = balance * monthlyRate(debt.rate);
    const maxPayment = balance + monthlyInterest;
    const current = payments.get(debt.id) ?? debt.minimum;
    const room = Math.max(0, maxPayment - current);
    const add = Math.min(extraBudget, room);

    if (add > PAYOFF_EPSILON) {
      payments.set(debt.id, current + add);
      extraBudget -= add;
    }
  }

  return payments;
}

export function calculateDebtPayoff(
  debts: Debt[],
  extraPayment: number,
  strategy: "avalanche" | "snowball"
): DebtPayoffPlan {
  const inputSnapshot = buildInputSnapshot(debts);
  const inputWarnings = detectInputWarnings(debts, inputSnapshot);

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
    minimum: getDebtMonthlyPayment(debt),
    termMonths: debt.term_months,
  }));

  const monthLimit = simulationMonthLimit(states);

  const steps: DebtPayoffStep[] = [];
  const ledger: DebtPayoffLedgerEntry[] = [];
  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const warnings = [...inputWarnings];
  let status: DebtPayoffPlan["status"] = "complete";

  while (states.some((debt) => debt.remaining > PAYOFF_EPSILON)) {
    if (month >= monthLimit) {
      status = "max_months_reached";
      warnings.push(
        `Расчёт остановлен на ${monthLimit} мес. — при текущих платежах долг не погашается.`
      );
      break;
    }

    month++;

    const monthlyPayments = allocateMonthlyPayments(states, extraPayment, strategy);

    for (const debt of states) {
      if (debt.remaining <= PAYOFF_EPSILON) continue;

      const payment = monthlyPayments.get(debt.id) ?? debt.minimum;
      const result = applyMonthlyPayment(debt.remaining, payment, debt.rate);
      debt.remaining = result.balanceAfter;
      totalInterest += result.paymentToInterest;
      totalPaid += result.paymentTotal;

      steps.push({
        month,
        debtTitle: debt.title,
        payment: result.paymentTotal,
        remaining: Math.max(0, debt.remaining),
        interestPaid: result.paymentToInterest,
      });

      ledger.push({
        month,
        debtTitle: debt.title,
        paymentType: "monthly",
        balanceBefore: result.balanceBefore,
        interestAccrued: result.interestAccrued,
        paymentTotal: result.paymentTotal,
        paymentToInterest: result.paymentToInterest,
        paymentToPrincipal: result.paymentToPrincipal,
        balanceAfter: result.balanceAfter,
      });

      if (debt.remaining > debt.initialBalance * MAX_BALANCE_MULTIPLIER) {
        status = "unpayable";
        warnings.push(
          `«${debt.title}»: остаток вырос более чем в ${MAX_BALANCE_MULTIPLIER}× — платежи не покрывают проценты.`
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
      return "Оба сценария непогашаемы при текущих платежах — увеличьте доплату или пересмотрите ежемесячные платежи.";
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

export function sumBaseMonthlyPayments(debts: Debt[]): number {
  return debts.reduce((sum, debt) => sum + getDebtMonthlyPayment(debt), 0);
}

export function totalDebtRemaining(debts: Debt[]): number {
  return debts.reduce((sum, debt) => sum + debt.remaining_amount, 0);
}
