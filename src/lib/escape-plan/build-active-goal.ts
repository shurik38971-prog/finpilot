import { resolveRouteType } from "@/lib/escape-plan/route-types";
import type { EscapePlanOption } from "@/types/escape-plan";

const ACTIVE_GOALS: Partial<Record<ReturnType<typeof resolveRouteType>, string>> =
  {
    cashback_partner:
      "Проверить первый безопасный источник дополнительного дохода через кэшбэк или партнёрскую программу",
    consulting_training:
      "Провести первую консультацию или обучающий разбор по выбранной теме",
    freelance_project: "Получить первый проект по выбранному направлению",
    on_site_service: "Получить первую заявку на выездную работу",
    remote_service: "Получить первую удалённую задачу",
    resale_trade: "Сделать первую проверку продажи выбранного товара",
    simple_side_job: "Выполнить первую разовую подработку",
    generic: "Проверить выбранное направление первым безопасным тестом",
  };

export function buildActiveGoalTitle(option: EscapePlanOption): string {
  const title = option.title.trim();

  if (option.type === "increase_income") {
    const routeType = resolveRouteType(option);
    const preset = ACTIVE_GOALS[routeType];
    if (preset) return preset;

    if (/сайт|веб|разработ/i.test(title)) {
      return "Получить первый заказ на доработку сайта";
    }
    return `Проверить направление «${title}» первым шагом`;
  }

  if (option.type === "reduce_expenses") {
    return `Сократить расходы: ${title}`;
  }

  return `Выполнить первый шаг: ${title}`;
}
