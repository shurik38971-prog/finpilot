import type { EscapePlanOption } from "@/types/escape-plan";
import type { FinancialTask } from "@/types/tasks";

export interface EscapeRouteStep {
  title: string;
  description: string;
  expected_result: string;
}

function step(
  title: string,
  description: string,
  expected_result: string
): EscapeRouteStep {
  return { title, description, expected_result };
}

function isOnSiteRepairRoute(title: string): boolean {
  return /сантех|ремонт.*выезд|выезд.*ремонт|мастер.*выезд/i.test(title);
}

function buildOnSiteRepairSteps(): EscapeRouteStep[] {
  return [
    step(
      "Определить список простых услуг",
      "Выберите 3–5 услуг, которые можете выполнить без сложных материалов: замена смесителя, устранение течи, подключение сифона, прочистка, мелкий ремонт.",
      "Понятно, какие услуги вы предлагаете клиентам."
    ),
    step(
      "Определить районы работы",
      "Определите 2–3 ближайших района, куда сможете добираться без авто или с минимальными затратами времени.",
      "Есть понятная зона обслуживания."
    ),
    step(
      "Подготовить базовый набор инструментов",
      "Проверьте, что есть ключи, уплотнители, герметик, расходники и рабочий телефон для связи.",
      "Вы готовы принять первый небольшой заказ."
    ),
    step(
      "Составить короткое описание услуги",
      "Напишите простое описание: какие работы выполняете, где работаете, примерные цены и как с вами связаться.",
      "Готов текст для объявления."
    ),
    step(
      "Создать объявление",
      "Подготовьте объявление для Авито, Юлы, Профи.ру или локальных чатов.",
      "Текст объявления готов к публикации."
    ),
    step(
      "Опубликовать объявление",
      "Разместите объявление и включите уведомления о новых сообщениях и заказах.",
      "Объявление опубликовано, ждёте отклики."
    ),
    step(
      "Ответить первым клиентам",
      "Отвечайте коротко: уточните задачу, район, сроки, цену и возможность выезда.",
      "Есть первые диалоги с клиентами."
    ),
    step(
      "Взять первый простой заказ",
      "Выберите заказ, который точно можете выполнить без риска и сложных материалов.",
      "Получен первый дополнительный доход."
    ),
    step(
      "Попросить отзыв",
      "После выполнения заказа попросите клиента оставить отзыв или короткую рекомендацию.",
      "Есть первый отзыв или рекомендация."
    ),
    step(
      "Записать полученный доход",
      "Внесите доход в ФинПилот и отметьте, сколько денег направляете на финансовую цель.",
      "Прогресс по цели обновлён."
    ),
    step(
      "Пересчитать прогресс",
      "Обновите маршрут: сколько осталось найти до цели и какой следующий шаг самый важный.",
      "Понятно, что делать дальше по маршруту."
    ),
  ];
}

function buildGenericIncomeSteps(option: EscapePlanOption): EscapeRouteStep[] {
  const title = option.title.trim();
  return [
    step(
      "Определить формат услуги",
      `Коротко опишите, что вы делаете по направлению «${title}»: для кого, в каком формате и с каким результатом.`,
      "Понятно ваше предложение для клиента."
    ),
    step(
      "Определить каналы поиска клиентов",
      "Выберите 2–3 площадки или способа, где ваши клиенты реально ищут исполнителей.",
      "Есть список каналов для старта."
    ),
    step(
      "Составить короткое описание услуги",
      "Напишите описание: услуга, район или формат, цена или вилка, контакт.",
      "Готов текст для объявления."
    ),
    step(
      "Создать объявление",
      option.first_step?.trim() ||
        "Подготовьте текст объявления для выбранных площадок.",
      "Текст объявления готов к публикации."
    ),
    step(
      "Опубликовать объявление",
      "Разместите объявление и включите уведомления о новых сообщениях.",
      "Объявление опубликовано."
    ),
    step(
      "Ответить первым клиентам",
      "Ответьте быстро, уточните задачу и договоритесь о первом шаге.",
      "Есть первые диалоги с клиентами."
    ),
    step(
      "Взять первый простой заказ",
      `Выберите самый простой заказ по направлению «${title}».`,
      "Получен первый дополнительный доход."
    ),
    step(
      "Записать полученный доход",
      "Внесите сумму в ФинПилот и отметьте, сколько направили на главную цель.",
      "Прогресс по цели обновлён."
    ),
    step(
      "Пересчитать прогресс",
      "Посмотрите, сколько осталось до цели, и выберите следующий шаг маршрута.",
      "Понятно, что делать дальше."
    ),
  ];
}

/** Canonical ordered steps for income routes. AI steps are not merged to avoid chaotic order. */
export function buildEscapeRouteSteps(option: EscapePlanOption): EscapeRouteStep[] {
  if (isOnSiteRepairRoute(option.title)) {
    return buildOnSiteRepairSteps();
  }
  return buildGenericIncomeSteps(option);
}

export function buildEscapeActionSteps(option: EscapePlanOption): string[] {
  return buildEscapeRouteSteps(option).map((s) => s.title);
}

export function getEscapeStepOrder(
  task: Pick<FinancialTask, "order_index" | "normalized_title">
): number {
  if (task.order_index != null && task.order_index > 0) {
    return task.order_index;
  }
  const match = task.normalized_title?.match(/^escape:[^:]+:(\d+)$/);
  if (match) return Number(match[1]) + 1;
  return Number.MAX_SAFE_INTEGER;
}

export function sortEscapeRouteTasks<
  T extends Pick<FinancialTask, "order_index" | "normalized_title">,
>(tasks: T[]): T[] {
  return [...tasks].sort(
    (a, b) => getEscapeStepOrder(a) - getEscapeStepOrder(b)
  );
}

export function splitRouteStepsForPreview(tasks: FinancialTask[]): {
  lastDone: FinancialTask | null;
  nextStep: FinancialTask | null;
  upcoming: FinancialTask[];
} {
  const ordered = sortEscapeRouteTasks(
    tasks.filter((task) => task.status !== "archived")
  );
  const done = ordered.filter((task) => task.status === "done");
  const pending = ordered.filter((task) => task.status === "pending");

  return {
    lastDone: done[done.length - 1] ?? null,
    nextStep: pending[0] ?? null,
    upcoming: pending.slice(1, 4),
  };
}
