import type { EscapePlanOption } from "@/types/escape-plan";

const PLATFORM_HINTS: Record<string, string[]> = {
  kwork: ["Создать аккаунт на Kwork", "Добавить 3 примера работ", "Отправить 10 откликов"],
};

function detectPlatformSteps(option: EscapePlanOption): string[] {
  const haystack = `${option.title} ${option.first_step}`.toLowerCase();
  if (haystack.includes("kwork")) return PLATFORM_HINTS.kwork;
  return [];
}

export function buildEscapeActionSteps(
  option: EscapePlanOption,
  plan7Days: string[]
): string[] {
  const steps: string[] = [];
  const add = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !steps.includes(trimmed)) steps.push(trimmed);
  };

  for (const step of detectPlatformSteps(option)) add(step);
  add(option.first_step);
  for (const step of plan7Days) add(step);

  if (option.type === "increase_income") {
    add("Получить первый ответ от клиента");
    add("Выполнить первый заказ");
  }

  if (steps.length < 3) {
    add(`Найти 2–3 площадки для «${option.title}»`);
    add(`Составить короткое описание услуги для «${option.title}»`);
  }

  return steps.slice(0, 6);
}
