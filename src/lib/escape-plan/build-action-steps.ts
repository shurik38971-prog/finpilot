import type { EscapePlanOption } from "@/types/escape-plan";

const PLATFORM_HINTS: Record<string, string[]> = {
  kwork: ["Создать аккаунт на Kwork", "Добавить 3 примера работ", "Отправить 10 откликов"],
};

function detectPlatformSteps(option: EscapePlanOption): string[] {
  const haystack = `${option.title} ${option.first_step}`.toLowerCase();
  if (haystack.includes("kwork")) return PLATFORM_HINTS.kwork;
  return [];
}

function appendTypeDefaults(option: EscapePlanOption, steps: string[]) {
  const add = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !steps.includes(trimmed)) steps.push(trimmed);
  };

  const title = option.title.trim();

  if (option.type === "increase_income") {
    add(`Составить короткое описание услуги: «${title}»`);
    add(`Подготовить текст объявления для «${title}»`);
    add("Выбрать 2–3 площадки для размещения");
    add("Разместить объявление на выбранных площадках");
    add("Ответить первым заинтересованным клиентам");
    add("Получить первый заказ");
    add("Зафиксировать дополнительный доход в FinPilot");
    add("Направить часть дохода на главную цель");
  } else if (option.type === "reduce_expenses") {
    add(`Составить список расходов, которые можно сократить: «${title}»`);
    add("Выбрать 1–2 статьи для отмены или замены");
    add("Отменить или пересмотреть выбранные подписки и траты");
    add("Зафиксировать экономию в FinPilot");
  } else if (option.type === "debt_action") {
    add("Собрать данные по текущим кредитам и ставкам");
    add(`Выполнить шаг по направлению «${title}»`);
    add("Сравнить условия и выбрать лучший вариант");
    add("Подать заявку или связаться с банком");
    add("Зафиксировать изменение платежа в FinPilot");
  }
}

/** Steps for the active route only — never mix global plan_7_days from AI. */
export function buildEscapeActionSteps(option: EscapePlanOption): string[] {
  const steps: string[] = [];
  const add = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !steps.includes(trimmed)) steps.push(trimmed);
  };

  for (const step of detectPlatformSteps(option)) add(step);

  if (option.action_steps?.length) {
    for (const step of option.action_steps) add(step);
  }

  add(option.first_step);
  appendTypeDefaults(option, steps);

  return steps.slice(0, 8);
}
