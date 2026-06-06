export type TaskCategory =
  | "debt_negotiation"
  | "cut_optional_spending"
  | "increase_income"
  | "budget_control"
  | "emergency_fund"
  | "other";

const CATEGORY_PATTERNS: Record<
  Exclude<TaskCategory, "other">,
  RegExp[]
> = {
  debt_negotiation: [
    /кредитор/i,
    /реструктуризац/i,
    /отсроч/i,
    /кредитн\w*\s*каникул/i,
    /снижен\w*\s*платеж/i,
    /договор\w*\s*(с\s+)?(банк|кредитор)/i,
    /позвон\w*\s*(кредитор|банк)/i,
    /переговор\w*\s*долг/i,
    /рефинанс/i,
    /рассроч/i,
    /микрозайм/i,
    /коллектор/i,
  ],
  cut_optional_spending: [
    /сократ\w*\s*трат/i,
    /необязательн\w*\s*трат/i,
    /подписк/i,
    /кафе/i,
    /доставк/i,
    /развлечен/i,
    /досуг/i,
    /отмен\w*\s*подписк/i,
    /импульсивн\w*\s*покуп/i,
    /лишн\w*\s*трат/i,
  ],
  increase_income: [
    /подработ/i,
    /фриланс/i,
    /дополнительн\w*\s*заказ/i,
    /продаж\w*\s*вещ/i,
    /взять\w*\s*проект/i,
    /дополнительн\w*\s*доход/i,
    /подработк/i,
  ],
  budget_control: [
    /бюджет/i,
    /контрол\w*\s*расход/i,
    /\bучёт\b/i,
    /\bучет\b/i,
    /категори\w*\s*расход/i,
    /планирован\w*\s*трат/i,
    /лимит\w*\s*трат/i,
    /провер\w*\s*категори/i,
  ],
  emergency_fund: [
    /подушк/i,
    /резерв/i,
    /запас\w*\s*на/i,
    /финансов\w*\s*подушк/i,
    /создать\w*\s*накоплен/i,
    /накопить\w*\s*резерв/i,
  ],
};

export function detectTaskCategory(
  title: string,
  description?: string | null
): TaskCategory {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(text))) {
      return category as TaskCategory;
    }
  }

  return "other";
}
