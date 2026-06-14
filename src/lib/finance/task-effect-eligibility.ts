import type { TaskCategory } from "@/lib/finance/detect-task-category";
import { formatCurrency } from "@/lib/utils";

const INFORMATIONAL_PATTERNS = [
  /продолжай\w*\s+вести\s+уч[её]т/i,
  /вести\s+уч[её]т\s+финанс/i,
  /добавля\w*\s+нов\w*\s+(доход|расход|операци)/i,
  /добавьте\s+реальн/i,
  /заполн\w*\s+данн/i,
  /следите\s+за\s+расход/i,
  /отмечайте\s+обязательн/i,
  /уточн\w*\s+информац/i,
  /фиксир\w*\s+(операци|трат|доход|расход)/i,
  /повышени\w*\s+точност/i,
  /точност\w*\s+анализ/i,
  /по\s+мере\s+их\s+появления/i,
];

const QUANTIFIABLE_PATTERNS = [
  /погас/i,
  /рефинанс/i,
  /реструктуризац/i,
  /подушк/i,
  /резерв\w*\s*(безопас|финанс|на\s)/i,
  /финансов\w*\s*подушк/i,
  /отлож/i,
  /накоп/i,
  /сбереж/i,
  /сократ\w*\s*трат/i,
  /сниз\w*\s+расход/i,
  /уменьш\w*\s+расход/i,
  /сократ\w*\s+расход/i,
  /эконом\w*\s+на/i,
  /отказ\w*\s+от\s+подписк/i,
  /лишн\w*\s*трат/i,
  /необязательн\w*\s*трат/i,
  /увелич\w*\s+доход/i,
  /подработ/i,
  /дополнительн\w*\s+доход/i,
  /досрочн\w*\s+погас/i,
  /переговор\w*\s*долг/i,
  /кредитор/i,
];

const QUANTIFIABLE_CATEGORIES = new Set<TaskCategory>([
  "debt_negotiation",
  "cut_optional_spending",
  "increase_income",
  "emergency_fund",
]);

export interface TaskExplanationContext {
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
  totalDebt: number;
  cushionAmount?: number;
  usesOnboardingBaseline?: boolean;
}

export function isInformationalFinancialTask(
  title: string,
  description?: string | null
): boolean {
  const text = `${title} ${description ?? ""}`;
  return INFORMATIONAL_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasQuantifiableFinancialEffect(
  title: string,
  description?: string | null,
  taskCategory?: TaskCategory | string | null
): boolean {
  if (isInformationalFinancialTask(title, description)) {
    return false;
  }

  if (
    taskCategory &&
    QUANTIFIABLE_CATEGORIES.has(taskCategory as TaskCategory)
  ) {
    return true;
  }

  const text = `${title} ${description ?? ""}`;
  return QUANTIFIABLE_PATTERNS.some((pattern) => pattern.test(text));
}

export function getImportanceMessage(
  title: string,
  description?: string | null
): string {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  if (/уч[её]т|операци|данн/i.test(text)) {
    return "Чем больше реальных данных будет в системе, тем точнее станут прогнозы и рекомендации FinPilot.";
  }

  if (/расход|трат/i.test(text)) {
    return "Регулярный контроль расходов помогает вовремя заметить отклонения от плана и скорректировать бюджет.";
  }

  if (/уточн|информац/i.test(text)) {
    return "Точные данные — основа для расчёта остатка, долговой нагрузки и сроков достижения целей.";
  }

  return "Это действие улучшает качество данных FinPilot и делает следующие рекомендации точнее.";
}

export function buildTaskExplanation(
  title: string,
  description: string | null | undefined,
  context: TaskExplanationContext
): string | null {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  if (isInformationalFinancialTask(title, description)) {
    if (context.usesOnboardingBaseline) {
      return "Анализ основан на Ваших ответах из анкеты";
    }
    return "Доходов, расходов, долгов и платежей пока мало";
  }

  if (/подушк|резерв|накоп|сбереж/i.test(text)) {
    const amount = context.cushionAmount ?? 0;
    return `Подушка = ${formatCurrency(amount)}`;
  }

  if (/долг|кредит|займ|ипотек|рефинанс|погас/i.test(text)) {
    if (context.totalDebt <= 0) return null;
    return `Общий долг = ${formatCurrency(context.totalDebt)}`;
  }

  if (
    /сократ|сниз|уменьш|эконом|трат|расход|подписк/i.test(text) &&
    context.monthlyIncome > 0
  ) {
    const ratio = Math.round(
      (context.monthlyExpenses / context.monthlyIncome) * 100
    );
    return `Расходы составляют ${ratio}% дохода`;
  }

  if (/доход|подработ|заработ/i.test(text) && context.monthlyIncome > 0) {
    return `Доход = ${formatCurrency(context.monthlyIncome)} / мес`;
  }

  if (context.netCashFlow < 0) {
    return `Остаток = ${formatCurrency(context.netCashFlow)} / мес`;
  }

  return null;
}

export function getDisplayableTaskImpact(task: {
  title: string;
  description: string | null;
  impact: import("@/types/task-impact").TaskImpact | null;
  task_category?: TaskCategory | string | null;
}): import("@/types/task-impact").TaskImpact | null {
  if (!task.impact) return null;
  if (
    !hasQuantifiableFinancialEffect(
      task.title,
      task.description,
      task.task_category
    )
  ) {
    return null;
  }
  return task.impact;
}
