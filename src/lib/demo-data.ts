import type { Frequency, IncomeType } from "@/types/database";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export const DEMO_INCOMES = [
  {
    title: "Разработка для клиента",
    amount: 85000,
    category: "freelance",
    date: daysAgo(5),
    income_type: "expected" as IncomeType,
    is_recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    title: "Оплата проекта",
    amount: 25000,
    category: "project",
    date: daysAgo(12),
    income_type: "actual" as IncomeType,
    is_recurring: false,
    frequency: null,
  },
  {
    title: "Роялти с курса",
    amount: 15000,
    category: "royalty",
    date: daysAgo(20),
    income_type: "expected" as IncomeType,
    is_recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    title: "Проект на Tilda",
    amount: 45000,
    category: "project",
    date: daysAgo(35),
    income_type: "actual" as IncomeType,
    is_recurring: false,
    frequency: null,
  },
];

export const DEMO_EXPENSES = [
  {
    title: "Аренда коворкинга",
    amount: 12000,
    category: "business",
    date: daysAgo(3),
    is_recurring: true,
    frequency: "monthly" as Frequency,
    is_essential: true,
  },
  {
    title: "Подписки (Figma, Notion)",
    amount: 3500,
    category: "subscriptions",
    date: daysAgo(8),
    is_recurring: true,
    frequency: "monthly" as Frequency,
    is_essential: false,
  },
  {
    title: "Продукты",
    amount: 18000,
    category: "food",
    date: daysAgo(10),
    is_recurring: true,
    frequency: "monthly" as Frequency,
    is_essential: true,
  },
  {
    title: "Транспорт",
    amount: 5000,
    category: "transport",
    date: daysAgo(15),
    is_recurring: true,
    frequency: "monthly" as Frequency,
    is_essential: true,
  },
  {
    title: "Коммунальные",
    amount: 6500,
    category: "utilities",
    date: daysAgo(18),
    is_recurring: true,
    frequency: "monthly" as Frequency,
    is_essential: true,
  },
  {
    title: "Кафе и доставка",
    amount: 8000,
    category: "food",
    date: daysAgo(22),
    is_recurring: true,
    frequency: "monthly" as Frequency,
    is_essential: false,
  },
];

export const DEMO_DEBTS = [
  {
    title: "Кредитная карта",
    total_amount: 120000,
    remaining_amount: 85000,
    interest_rate: 24,
    minimum_payment: 5200,
    calculated_monthly_payment: 5200,
    actual_monthly_payment: null,
    term_months: 18,
    payment_type: "annuity" as const,
    debt_kind: "credit_card" as const,
    due_day: 15,
    is_overdue: false,
    notes: null,
  },
  {
    title: "Рассрочка на ноутбук",
    total_amount: 90000,
    remaining_amount: 45000,
    interest_rate: 0,
    minimum_payment: 7500,
    calculated_monthly_payment: 7500,
    actual_monthly_payment: 7500,
    term_months: 6,
    payment_type: "annuity" as const,
    debt_kind: "installment" as const,
    due_day: 5,
    is_overdue: false,
    notes: null,
  },
];

const DEMO_INCOME_TITLES = new Set(DEMO_INCOMES.map((income) => income.title));
const DEMO_DEBT_TITLES = new Set(DEMO_DEBTS.map((debt) => debt.title));

/** True when finances match the seeded demo dataset (not user-entered data). */
export function hasDemoDataLoaded(
  incomes: Array<{ title: string }>,
  debts: Array<{ title: string }> = []
): boolean {
  const incomeMatches = incomes.filter((income) =>
    DEMO_INCOME_TITLES.has(income.title)
  ).length;
  if (incomeMatches >= 2) return true;
  return debts.some((debt) => DEMO_DEBT_TITLES.has(debt.title));
}
