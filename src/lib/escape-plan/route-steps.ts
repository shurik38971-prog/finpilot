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
  return /сантех|ремонт|выезд|мастер|руками/i.test(title);
}

function buildOnSiteRepairSteps(option: EscapePlanOption): EscapeRouteStep[] {
  return [
    step(
      "Подготовить список услуг",
      "Выберите 3–5 простых услуг, которые можете выполнить: замена смесителя, устранение течи, подключение сифона, мелкий ремонт.",
      "Понятно, что именно вы предлагаете клиентам."
    ),
    step(
      "Подготовить базовый набор инструментов",
      "Проверьте, что есть ключи, уплотнители, герметик, расходники и рабочий телефон для связи.",
      "Вы готовы принять первый небольшой заказ."
    ),
    step(
      "Составить короткое объявление",
      `Напишите текст для «${option.title}»: какие услуги делаете, район, примерная цена, как связаться.`,
      "Готов текст для публикации."
    ),
    step(
      "Разместить объявление",
      "Разместите объявление на Авито, в местных чатах, на досках объявлений или в соцсетях.",
      "Появились первые просмотры и обращения."
    ),
    step(
      "Ответить первым клиентам",
      "Отвечайте коротко, уточняйте задачу, район, сроки и цену.",
      "Есть первые реальные диалоги."
    ),
    step(
      "Получить первый заказ",
      "Выберите простой заказ, который точно можете выполнить без риска и сложных материалов.",
      "Получен первый дополнительный доход."
    ),
    step(
      "Записать доход и направить часть на цель",
      "Внесите полученную сумму в FinPilot и отметьте, сколько направили на долг или цель.",
      "Прогресс по цели обновлён."
    ),
  ];
}

function buildGenericIncomeSteps(option: EscapePlanOption): EscapeRouteStep[] {
  const title = option.title.trim();
  return [
    step(
      `Составить описание услуги: «${title}»`,
      `Коротко опишите, что вы делаете, для кого и в каком формате работаете.`,
      "Клиенту понятно ваше предложение."
    ),
    step(
      "Подготовить текст объявления",
      `Напишите объявление: услуга, район или формат, цена или вилка, контакт.`,
      "Готов текст для публикации."
    ),
    step(
      "Выбрать 2–3 площадки",
      "Подберите площадки, где ваши клиенты реально ищут исполнителей.",
      "Есть список мест для размещения."
    ),
    step(
      "Разместить объявление",
      option.first_step || "Опубликуйте объявление на выбранных площадках.",
      "Появились первые просмотры или отклики."
    ),
    step(
      "Ответить первым клиентам",
      "Ответьте быстро, уточните задачу и договоритесь о первом шаге.",
      "Есть первые диалоги с клиентами."
    ),
    step(
      "Получить первый заказ",
      `Выберите самый простой заказ по направлению «${title}».`,
      "Получен первый дополнительный доход."
    ),
    step(
      "Записать доход и направить часть на цель",
      "Внесите сумму в FinPilot и отметьте, сколько направили на главную цель.",
      "Прогресс по цели обновлён."
    ),
  ];
}

function fromAiActionSteps(option: EscapePlanOption): EscapeRouteStep[] | null {
  if (!option.action_steps?.length) return null;
  return option.action_steps.map((title, index) =>
    step(
      title,
      `Шаг ${index + 1} по маршруту «${option.title}».`,
      `Вы выполнили шаг и продвинулись по направлению «${option.title}».`
    )
  );
}

function buildDebtActionSteps(option: EscapePlanOption): EscapeRouteStep[] {
  return [
    step(
      "Собрать данные по кредитам",
      "Выпишите остатки, ставки, ежемесячные платежи и штрафы по каждому обязательству.",
      "Есть полная картина по долгам."
    ),
    step(
      option.first_step || `Сделать первый шаг: «${option.title}»`,
      `Действие только по направлению «${option.title}», без смешения с другими вариантами.`,
      "Понятно, что делать дальше по этому маршруту."
    ),
    step(
      "Сравнить условия",
      "Сопоставьте предложения банков или варианты реструктуризации.",
      "Выбран лучший вариант для вашей ситуации."
    ),
    step(
      "Подать заявку или связаться с банком",
      "Отправьте заявку или созвонитесь для уточнения условий.",
      "Процесс по выбранному маршруту запущен."
    ),
    step(
      "Зафиксировать результат в FinPilot",
      "Обновите данные по долгам или платежам после изменений.",
      "Финансовая картина в приложении актуальна."
    ),
  ];
}

function buildExpenseCutSteps(option: EscapePlanOption): EscapeRouteStep[] {
  return [
    step(
      `Составить список трат: «${option.title}»`,
      "Выпишите подписки и регулярные траты, которые можно сократить.",
      "Видно, где можно освободить деньги."
    ),
    step(
      "Выбрать 1–2 статьи для отмены",
      "Отметьте траты с быстрым эффектом и без критичного ущерба.",
      "Есть конкретные статьи для сокращения."
    ),
    step(
      "Отменить или пересмотреть траты",
      option.first_step || "Отмените подписки или договоритесь о снижении платежа.",
      "Ежемесячные расходы уменьшились."
    ),
    step(
      "Зафиксировать экономию в FinPilot",
      "Обновите расходы, чтобы видеть эффект в бюджете.",
      "Экономия отражена в финансовой картине."
    ),
  ];
}

export function buildEscapeRouteSteps(option: EscapePlanOption): EscapeRouteStep[] {
  const fromAi = fromAiActionSteps(option);
  if (fromAi && fromAi.length >= 5) {
    return fromAi.slice(0, 8);
  }

  let steps: EscapeRouteStep[];
  if (option.type === "debt_action") {
    steps = buildDebtActionSteps(option);
  } else if (option.type === "reduce_expenses") {
    steps = buildExpenseCutSteps(option);
  } else if (isOnSiteRepairRoute(option.title)) {
    steps = buildOnSiteRepairSteps(option);
  } else {
    steps = buildGenericIncomeSteps(option);
  }

  if (fromAi) {
    const seen = new Set(steps.map((s) => s.title));
    for (const aiStep of fromAi) {
      if (!seen.has(aiStep.title)) {
        steps.push(aiStep);
        seen.add(aiStep.title);
      }
    }
  }

  return steps.slice(0, 8);
}

export function buildEscapeActionSteps(option: EscapePlanOption): string[] {
  return buildEscapeRouteSteps(option).map((s) => s.title);
}

export function getEscapeStepOrder(
  task: Pick<FinancialTask, "normalized_title" | "created_at">
): number {
  const match = task.normalized_title?.match(/^escape:[^:]+:(\d+)$/);
  if (match) return Number(match[1]);
  return Number.MAX_SAFE_INTEGER;
}

export function sortEscapeRouteTasks<T extends Pick<FinancialTask, "normalized_title" | "created_at">>(
  tasks: T[]
): T[] {
  return [...tasks].sort(
    (a, b) =>
      getEscapeStepOrder(a) - getEscapeStepOrder(b) ||
      a.created_at.localeCompare(b.created_at)
  );
}
