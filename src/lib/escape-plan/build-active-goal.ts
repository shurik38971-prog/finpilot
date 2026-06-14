import { isCashbackPartnerRoute } from "@/lib/escape-plan/route-steps";
import type { EscapePlanOption } from "@/types/escape-plan";

export function buildActiveGoalTitle(option: EscapePlanOption): string {
  const title = option.title.trim();

  if (option.type === "increase_income") {
    if (isCashbackPartnerRoute(title)) {
      return "Проверить первый безопасный источник дополнительного дохода через кэшбэк или партнёрскую программу";
    }
    if (/сайт|веб|разработ/i.test(title)) {
      return "Получить первый заказ на доработку сайта";
    }
    return `Получить первый заказ по направлению «${title}»`;
  }

  if (option.type === "reduce_expenses") {
    return `Сократить расходы: ${title}`;
  }

  return `Выполнить первый шаг: ${title}`;
}
