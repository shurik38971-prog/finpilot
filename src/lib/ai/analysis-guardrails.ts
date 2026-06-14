import type {
  AiAction30Day,
  AiAnalysisResult,
  AnalysisPlanItem,
  NextBestAction,
} from "@/types/analysis";

export interface AnalysisDataFlags {
  hasClients: boolean;
  hasInvoices: boolean;
  hasOverdueReceivables: boolean;
  hasEmployerSalaryIssues: boolean;
  isFirstAnalysis: boolean;
  isPreliminary: boolean;
  hasOnboardingBaseline: boolean;
  subscriptionExpensesTotal: number;
  savingsCushionAmount: number;
  expenseBreakdown: Array<{
    title: string;
    category: string;
    amount: number;
    isEssential: boolean;
  }>;
}

const CLIENT_RECEIVABLE_PATTERNS = [
  /заказчик/i,
  /клиент/i,
  /дебитор/i,
  /неоплачен/i,
  /просроч/i,
  /задержива\w*\s+оплат/i,
  /ускор\w*\s+оплат/i,
  /выстав\w*\s+сч[её]т/i,
  /связаться\s+с\s+заказчик/i,
  /напомнить\s+о\s+сч[её]т/i,
  /ожида\w*\s+оплат/i,
  /дождаться\s+оплат/i,
];

const EMPLOYER_SALARY_PATTERNS = [
  /работодател/i,
  /зарплат\w*\s+не\s+пришл/i,
  /не\s+получил\w*\s+зарплат/i,
  /задерж\w*\s+зарплат/i,
  /связаться\s+с\s+работодател/i,
];

const INCOME_CONFIRMATION_PATTERNS = [
  /подтверд\w*\s+доход/i,
  /подтверд\w*\s+зарплат/i,
  /подтверд\w*\s+поступлен/i,
  /провер\w*\s+поступлен/i,
  /уточн\w*\s+доход/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function isForbiddenRecommendation(
  text: string,
  flags: AnalysisDataFlags
): boolean {
  const normalized = text.trim();
  if (!normalized) return false;

  if (!flags.hasClients && !flags.hasInvoices && !flags.hasOverdueReceivables) {
    if (matchesAny(normalized, CLIENT_RECEIVABLE_PATTERNS)) return true;
  }

  if (!flags.hasEmployerSalaryIssues) {
    if (matchesAny(normalized, EMPLOYER_SALARY_PATTERNS)) return true;
  }

  if (
    flags.hasOnboardingBaseline &&
    matchesAny(normalized, INCOME_CONFIRMATION_PATTERNS)
  ) {
    return true;
  }

  if (flags.subscriptionExpensesTotal === 0 && /подписк/i.test(normalized)) {
    return true;
  }

  if (flags.hasOnboardingBaseline) {
    if (/добавьте\s+реальн/i.test(normalized)) return true;
    if (/реальные\s+доходы/i.test(normalized)) return true;
    if (/зарплат\w*\s+не\s+получен/i.test(normalized)) return true;
  }

  return false;
}

function filterTextList(items: string[] | undefined, flags: AnalysisDataFlags) {
  return (items ?? []).filter((item) => !isForbiddenRecommendation(item, flags));
}

function filterPlanItems(
  items: AnalysisPlanItem[] | undefined,
  flags: AnalysisDataFlags
) {
  return (items ?? []).filter(
    (item) =>
      !isForbiddenRecommendation(item.action, flags) &&
      !isForbiddenRecommendation(item.why, flags)
  );
}

function filterActions30Days(
  items: AiAction30Day[] | undefined,
  flags: AnalysisDataFlags
) {
  return (items ?? []).filter(
    (item) =>
      !isForbiddenRecommendation(item.action, flags) &&
      !isForbiddenRecommendation(item.effect ?? "", flags)
  );
}

function filterNextBestAction(
  action: NextBestAction | undefined,
  flags: AnalysisDataFlags
): NextBestAction | undefined {
  if (!action?.title?.trim()) return undefined;
  if (
    isForbiddenRecommendation(action.title, flags) ||
    isForbiddenRecommendation(action.description ?? "", flags)
  ) {
    return undefined;
  }
  return action;
}

function pickFallbackNextBestAction(
  parsed: AiAnalysisResult
): NextBestAction | undefined {
  for (const action of parsed.actions_30_days ?? []) {
    if (action.action?.trim()) {
      return {
        title: action.action.trim(),
        description: action.effect?.trim() ?? "",
        impact_score: 70,
        impact_label: "Заметно поможет",
        due_days: 14,
      };
    }
  }

  for (const plan of [
    ...(parsed.plan_7_days ?? []),
    ...(parsed.plan_30_days ?? []),
  ]) {
    if (plan.action?.trim()) {
      return {
        title: plan.action.trim(),
        description: plan.why?.trim() ?? "",
        impact_score: 65,
        impact_label: "Заметно поможет",
        due_days: 7,
      };
    }
  }

  return undefined;
}

export function buildAnalysisGuardrailRules(flags: AnalysisDataFlags): string {
  const lines = [
    "СТРОГИЕ ПРАВИЛА (нарушать нельзя):",
    "- Каждая рекомендация должна опираться только на данные из JSON ниже.",
    "- Если данных нет — не делай выводов и не давай советов по этой теме.",
  ];

  if (!flags.hasClients && !flags.hasInvoices && !flags.hasOverdueReceivables) {
    lines.push(
      "- В системе НЕТ клиентов, счетов и просроченных оплат. ЗАПРЕЩЕНО упоминать: заказчиков, клиентов, счета, просрочки, ускорение оплаты, дебиторку."
    );
  }

  if (!flags.hasEmployerSalaryIssues) {
    lines.push(
      "- ЗАПРЕЩЕНО писать про задержку зарплаты или проблемы с работодателем, если пользователь не сообщал об этом."
    );
  }

  if (flags.subscriptionExpensesTotal > 0) {
    lines.push(
      `- Подписки в данных: ${flags.subscriptionExpensesTotal} ₽/мес — можно рекомендовать пересмотреть подписки.`
    );
  } else {
    lines.push("- Подписок в данных нет — не рекомендуй сокращать подписки.");
  }

  if (flags.savingsCushionAmount === 0) {
    lines.push(
      "- Накопления / подушка = 0 ₽ — можно рекомендовать создать подушку безопасности."
    );
  }

  if (flags.isFirstAnalysis) {
    lines.push(
      "- Это ПЕРВЫЙ анализ пользователя. Будь максимально консервативен: только факты из данных, без домыслов о внешних причинах."
    );
  }

  if (flags.hasOnboardingBaseline) {
    lines.push(
      "- Ответы из анкеты УЖЕ считаются реальными исходными. currentIncome / monthlyIncome — это доход месяца из анкеты.",
      "- ЗАПРЕЩЕНО просить «добавить реальные доходы» или писать, что доход не указан, если currentIncome > 0."
    );
  }

  if (flags.isPreliminary) {
    lines.push(
      "- РЕЖИМ ПРЕДВАРИТЕЛЬНОЙ ОЦЕНКИ. Не давай жёстких или срочных советов.",
      "- ЗАПРЕЩЕНО: найти подработку, увеличить доход на конкретную сумму, связаться с заказчиком/работодателем, взять кредит, рефинансировать долг.",
      "- РАЗРЕШЕНО: следить за расходами, добавлять доходы, расходы, долги и платежи по мере появления, формировать подушку, отмечать обязательные платежи.",
      "- next_best_action: мягкий шаг про добавление доходов, расходов, долгов и платежей, а не повторный ввод дохода из анкеты."
    );
  }

  if (flags.expenseBreakdown.length > 0) {
    lines.push(
      "- Расходы по категориям:",
      ...flags.expenseBreakdown.map(
        (item) =>
          `  • ${item.title} (${item.category}${item.isEssential ? ", обязательный" : ", необязательный"}): ${item.amount} ₽/мес`
      )
    );
  }

  return lines.join("\n");
}

export function buildAnalysisSystemPrompt(
  profileTypeLabel: string,
  flags: AnalysisDataFlags
): string {
  const conservative = flags.isPreliminary
    ? " Это предварительная оценка по примерным данным — только мягкие ориентиры, без срочных финансовых директив."
    : flags.isFirstAnalysis
      ? " Это первый анализ — только консервативные выводы по фактам."
      : "";

  return `Ты помогаешь пользователю FinPilot (${profileTypeLabel}) разобраться с деньгами. Пиши простым языком — без слов «денежный поток», «ликвидность», «долговая нагрузка», «финансовая устойчивость».${conservative}
Твоя задача:
- найти главную угрозу на основе имеющихся цифр;
- найти утечки денег только там, где они видны в расходах;
- оценить, хватит ли денег до следующего дохода;
- дать план на 7, 30 и 90 дней;
- выбрать next_best_action — одно самое важное дело;
- дать actions_30_days — конкретные шаги и чем они помогут.
Не выдумывай внешние события (клиенты, счета, работодатель), если их нет в данных.
Если с деньгами всё неплохо — объясни почему. Если плохо — не смягчай, но опирайся на цифры.
Отвечай только валидным JSON без markdown.`;
}

export function sanitizeAnalysisResult(
  parsed: AiAnalysisResult,
  flags: AnalysisDataFlags
): AiAnalysisResult {
  const summary = isForbiddenRecommendation(parsed.summary ?? "", flags)
    ? "По введённым данным видно соотношение доходов и расходов. Детали — в планах ниже."
    : parsed.summary;

  const mainThreat = isForbiddenRecommendation(parsed.main_threat ?? "", flags)
    ? isForbiddenRecommendation(parsed.main_problem ?? "", flags)
      ? summary ?? "Главная угроза не определена по имеющимся данным."
      : (parsed.main_problem ?? summary ?? "Главная угроза не определена по имеющимся данным.")
    : (parsed.main_threat ?? summary ?? "Главная угроза не определена по имеющимся данным.");

  const mainProblem = isForbiddenRecommendation(parsed.main_problem ?? "", flags)
    ? undefined
    : parsed.main_problem;

  const moneyLeaks = filterTextList(parsed.money_leaks, flags);
  const plan7 = filterPlanItems(parsed.plan_7_days, flags);
  const plan30 = filterPlanItems(parsed.plan_30_days, flags);
  const plan90 = filterPlanItems(parsed.plan_90_days, flags);
  const actions30 = filterActions30Days(parsed.actions_30_days, flags);

  let nextBest = filterNextBestAction(parsed.next_best_action, flags);
  if (!nextBest) {
    nextBest = pickFallbackNextBestAction({
      ...parsed,
      actions_30_days: actions30,
      plan_7_days: plan7,
      plan_30_days: plan30,
    });
  }

  const debtRecommendation = isForbiddenRecommendation(
    parsed.debt_recommendation ?? "",
    flags
  )
    ? undefined
    : parsed.debt_recommendation;

  const health_explanation = isForbiddenRecommendation(
    parsed.health_explanation ?? "",
    flags
  )
    ? "Оценка построена только на данных, которые вы указали в FinPilot."
    : parsed.health_explanation;

  const cashflow_forecast_comment = isForbiddenRecommendation(
    parsed.cashflow_forecast_comment ?? "",
    flags
  )
    ? undefined
    : parsed.cashflow_forecast_comment;

  return {
    ...parsed,
    summary,
    main_threat: mainThreat,
    main_problem: mainProblem,
    health_explanation,
    money_leaks: moneyLeaks,
    plan_7_days: plan7,
    plan_30_days: plan30,
    plan_90_days: plan90,
    actions_30_days: actions30,
    next_best_action: nextBest,
    debt_recommendation: debtRecommendation,
    cashflow_forecast_comment,
    risks: (parsed.risks ?? []).filter(
      (risk) =>
        !isForbiddenRecommendation(risk.title, flags) &&
        !isForbiddenRecommendation(risk.description, flags)
    ),
  };
}

export function buildAnalysisDataFlags(input: {
  expenses: Array<{
    title: string;
    category: string;
    amount: number;
    is_essential: boolean;
  }>;
  goals: Array<{ type: string; current_amount: number }>;
  analysisCount: number;
  profileType: string;
  primaryMonthlyIncome: number;
  isPreliminary?: boolean;
  hasOnboardingBaseline?: boolean;
}): AnalysisDataFlags {
  const expenseBreakdown = input.expenses
    .filter((expense) => expense.amount > 0)
    .map((expense) => ({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      isEssential: expense.is_essential,
    }));

  const subscriptionExpensesTotal = expenseBreakdown
    .filter((expense) => expense.category === "subscriptions")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const cushionGoal = input.goals.find((goal) => goal.type === "safety_cushion");

  return {
    hasClients: false,
    hasInvoices: false,
    hasOverdueReceivables: false,
    hasEmployerSalaryIssues: false,
    isFirstAnalysis: input.analysisCount <= 1,
    isPreliminary: input.isPreliminary ?? false,
    hasOnboardingBaseline: input.hasOnboardingBaseline ?? false,
    subscriptionExpensesTotal,
    savingsCushionAmount: cushionGoal?.current_amount ?? 0,
    expenseBreakdown,
  };
}
