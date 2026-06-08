import type { EscapePlanOption } from "@/types/escape-plan";

export function buildEscapeActionSteps(
  option: EscapePlanOption,
  plan7Days: string[]
): string[] {
  const steps: string[] = [];
  const add = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !steps.includes(trimmed)) steps.push(trimmed);
  };

  add(option.first_step);
  for (const step of plan7Days) add(step);

  if (steps.length < 3) {
    add(`Найти 2–3 площадки, где можно предлагать «${option.title}»`);
    add(`Составить короткое описание услуги для «${option.title}»`);
  }

  return steps.slice(0, 5);
}
