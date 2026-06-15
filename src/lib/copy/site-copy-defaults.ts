export type SiteCopyGroup =
  | "nav"
  | "pages"
  | "rescue"
  | "escape"
  | "buttons"
  | "actions";

export interface SiteCopyDefinition {
  key: string;
  defaultValue: string;
  group: SiteCopyGroup;
  label: string;
}

export const SITE_COPY_GROUP_LABELS: Record<SiteCopyGroup, string> = {
  nav: "Меню",
  pages: "Заголовки страниц",
  rescue: "План спасения",
  escape: "Выход из ситуации",
  buttons: "Кнопки",
  actions: "Что делать",
};

export const SITE_COPY_DEFINITIONS: SiteCopyDefinition[] = [
  // Меню
  { key: "nav.dashboard", group: "nav", label: "Дашборд", defaultValue: "Дашборд" },
  { key: "nav.income", group: "nav", label: "Доходы", defaultValue: "Доходы" },
  { key: "nav.expenses", group: "nav", label: "Расходы", defaultValue: "Расходы" },
  { key: "nav.debts", group: "nav", label: "Долги", defaultValue: "Долги" },
  { key: "nav.crisis", group: "nav", label: "Антикризис", defaultValue: "Антикризис" },
  {
    key: "nav.escape_plan",
    group: "nav",
    label: "Выход из ситуации",
    defaultValue: "Выход из ситуации",
  },
  { key: "nav.scenarios", group: "nav", label: "Сценарии", defaultValue: "Сценарии" },
  { key: "nav.simulator", group: "nav", label: "Что если", defaultValue: "Что если" },
  {
    key: "nav.actions",
    group: "nav",
    label: "Что делать",
    defaultValue: "Что делать",
  },
  {
    key: "nav.analyze",
    group: "nav",
    label: "Финансовый разбор",
    defaultValue: "Финансовый разбор",
  },
  { key: "nav.history", group: "nav", label: "История", defaultValue: "История" },
  { key: "nav.goals", group: "nav", label: "Цели", defaultValue: "Цели" },
  {
    key: "nav.feedback",
    group: "nav",
    label: "Обратная связь",
    defaultValue: "Обратная связь",
  },
  { key: "nav.faq", group: "nav", label: "FAQ", defaultValue: "FAQ" },
  {
    key: "nav.settings",
    group: "nav",
    label: "Настройки",
    defaultValue: "Настройки",
  },
  { key: "nav.admin", group: "nav", label: "Админка", defaultValue: "Админка" },

  // Заголовки страниц
  {
    key: "page.escape_plan.title",
    group: "pages",
    label: "Выход из ситуации — заголовок",
    defaultValue: "Выход из ситуации",
  },
  {
    key: "page.escape_plan.description",
    group: "pages",
    label: "Выход из ситуации — подзаголовок",
    defaultValue: "Где вы сейчас, что мешает и что делать дальше — без лишних цифр",
  },
  {
    key: "page.dashboard.title",
    group: "pages",
    label: "Главный экран — заголовок",
    defaultValue: "Поймите, что происходит с Вашими деньгами",
  },
  {
    key: "page.dashboard.hero_subtitle",
    group: "pages",
    label: "Главный экран — подзаголовок",
    defaultValue:
      "Когда деньги уходят быстрее, чем планировалось, сложно понять, что именно мешает. ФинПилот помогает разложить доходы, расходы, долги и платежи по полкам — и собрать понятный план на ближайшие 30 дней.",
  },
  {
    key: "page.landing.intro",
    group: "pages",
    label: "Лендинг — вводный абзац",
    defaultValue:
      "Когда платежей много, расходы растут, а деньги расходятся быстрее, чем планировалось, легко потерять ощущение контроля. ФинПилот помогает разобраться, что мешает, и собрать понятный план действий.",
  },
  {
    key: "page.dashboard.hero_audience",
    group: "pages",
    label: "Главный экран — для кого",
    defaultValue:
      "Подходит тем, кто работает по найму, на себя или совмещает несколько источников дохода.",
  },
  {
    key: "page.landing.badge",
    group: "pages",
    label: "Лендинг — badge над заголовком",
    defaultValue: "Финансовый навигатор для личных денег",
  },
  {
    key: "page.landing.cta",
    group: "pages",
    label: "Лендинг — кнопка",
    defaultValue: "Начать разбор ситуации",
  },
  {
    key: "page.landing.cta_hint",
    group: "pages",
    label: "Лендинг — подпись под кнопкой",
    defaultValue:
      "Это займёт 5–7 минут. Вы ответите на несколько вопросов, а ФинПилот соберёт понятный разбор и первый шаг.",
  },
  {
    key: "page.landing.outcomes_title",
    group: "pages",
    label: "Лендинг — заголовок блока результатов",
    defaultValue: "Что Вы получите после разбора ситуации",
  },
  {
    key: "page.landing.outcome_1",
    group: "pages",
    label: "Лендинг — результат 1",
    defaultValue: "понятную картину Вашей финансовой ситуации",
  },
  {
    key: "page.landing.outcome_2",
    group: "pages",
    label: "Лендинг — результат 2",
    defaultValue: "варианты выхода из текущего положения",
  },
  {
    key: "page.landing.outcome_3",
    group: "pages",
    label: "Лендинг — результат 3",
    defaultValue: "план действий на ближайшие 30 дней",
  },
  {
    key: "page.landing.outcome_4",
    group: "pages",
    label: "Лендинг — результат 4",
    defaultValue: "идеи, где можно найти запас в расходах",
  },
  {
    key: "page.landing.outcome_5",
    group: "pages",
    label: "Лендинг — результат 5",
    defaultValue:
      "варианты дополнительного дохода под Ваши навыки и ситуацию",
  },
  {
    key: "page.landing.outcome_6",
    group: "pages",
    label: "Лендинг — результат 6",
    defaultValue: "первый шаг, с которого можно начать уже сегодня",
  },
  {
    key: "page.dashboard.hero_cta",
    group: "pages",
    label: "Главный экран — кнопка",
    defaultValue: "Разобрать мою ситуацию",
  },
  {
    key: "page.dashboard.title_active",
    group: "pages",
    label: "Главный экран — заголовок (после разбора)",
    defaultValue: "Ваша ситуация",
  },
  {
    key: "page.dashboard.value_card_1_title",
    group: "pages",
    label: "Главный экран — карточка 1, заголовок",
    defaultValue: "Поймём, что требует внимания",
  },
  {
    key: "page.dashboard.value_card_1_text",
    group: "pages",
    label: "Главный экран — карточка 1, текст",
    defaultValue:
      "Покажем, что сильнее всего давит: расходы, долги, платежи или нехватка дохода.",
  },
  {
    key: "page.dashboard.value_card_2_title",
    group: "pages",
    label: "Главный экран — карточка 2, заголовок",
    defaultValue: "Составим план действий",
  },
  {
    key: "page.dashboard.value_card_2_text",
    group: "pages",
    label: "Главный экран — карточка 2, текст",
    defaultValue:
      "Разделим рекомендации на шаги: что сделать сегодня, за 7 дней и на месяц вперёд.",
  },
  {
    key: "page.dashboard.value_card_3_title",
    group: "pages",
    label: "Главный экран — карточка 3, заголовок",
    defaultValue: "Подскажем, где найти запас",
  },
  {
    key: "page.dashboard.value_card_3_text",
    group: "pages",
    label: "Главный экран — карточка 3, текст",
    defaultValue:
      "Покажем, какие расходы можно пересмотреть и какие варианты дополнительного дохода подходят под Ваши навыки и ситуацию.",
  },
  {
    key: "page.actions.title",
    group: "pages",
    label: "Что делать — заголовок",
    defaultValue: "Что делать сейчас",
  },
  {
    key: "page.actions.description_cleanup",
    group: "pages",
    label: "Что делать — подзаголовок (cleanup)",
    defaultValue: "Конкретные шаги — что сделать сегодня, чтобы продвинуться",
  },
  {
    key: "page.actions.description",
    group: "pages",
    label: "Что делать — подзаголовок",
    defaultValue: "Дела из финансового разбора — сначала самое важное, потом остальное",
  },

  // План спасения
  {
    key: "rescue.badge",
    group: "rescue",
    label: "Метка блока",
    defaultValue: "План спасения",
  },
  {
    key: "rescue.headline",
    group: "rescue",
    label: "Заголовок блока",
    defaultValue: "Где вы сейчас и что делать",
  },
  {
    key: "rescue.current_situation",
    group: "rescue",
    label: "Секция: текущая ситуация",
    defaultValue: "Текущая ситуация",
  },
  {
    key: "rescue.main_problem",
    group: "rescue",
    label: "Секция: что требует внимания",
    defaultValue: "Что требует внимания",
  },
  {
    key: "rescue.monthly_gap",
    group: "rescue",
    label: "Секция: не хватает",
    defaultValue: "Не хватает",
  },
  {
    key: "rescue.best_option",
    group: "rescue",
    label: "Секция: лучший вариант",
    defaultValue: "Лучший вариант",
  },
  {
    key: "rescue.next_step",
    group: "rescue",
    label: "Секция: следующий шаг",
    defaultValue: "Следующий шаг",
  },
  {
    key: "rescue.expected_result",
    group: "rescue",
    label: "Секция: ожидаемый результат",
    defaultValue: "Ожидаемый результат",
  },
  {
    key: "rescue.progress_label",
    group: "rescue",
    label: "Прогресс — метка",
    defaultValue: "Прогресс",
  },
  {
    key: "rescue.primary_goal",
    group: "rescue",
    label: "Прогресс — главная цель",
    defaultValue: "Главная цель",
  },
  {
    key: "rescue.in_progress",
    group: "rescue",
    label: "Прогресс — сейчас в работе",
    defaultValue: "Сейчас в работе:",
  },
  {
    key: "rescue.income_found",
    group: "rescue",
    label: "Прогресс — доход найден",
    defaultValue: "Дополнительный доход найден",
  },
  {
    key: "rescue.income_remaining",
    group: "rescue",
    label: "Прогресс — осталось найти",
    defaultValue: "Осталось найти",
  },

  // Выход из ситуации
  {
    key: "escape.survey_title",
    group: "escape",
    label: "Анкета — заголовок",
    defaultValue: "Анкета возможностей",
  },
  {
    key: "escape.survey_description",
    group: "escape",
    label: "Анкета — описание",
    defaultValue: "Ответьте на вопросы — подберём варианты под Вашу ситуацию",
  },
  {
    key: "escape.primary_recommendation",
    group: "escape",
    label: "Главная рекомендация",
    defaultValue: "Рекомендуем начать с",
  },
  {
    key: "escape.no_route_selected_title",
    group: "escape",
    label: "Маршрут не выбран — заголовок",
    defaultValue: "Вы ещё не выбрали маршрут",
  },
  {
    key: "escape.no_route_selected_hint",
    group: "escape",
    label: "Маршрут не выбран — подсказка",
    defaultValue:
      "Ниже — подходящие направления на основе Ваших навыков и целей. Маршрут станет активным только после нажатия «Выбрать этот маршрут».",
  },
  {
    key: "escape.route_recommendations_title",
    group: "escape",
    label: "Заголовок списка направлений",
    defaultValue: "Подходящие направления",
  },
  {
    key: "escape.chosen_route_title",
    group: "escape",
    label: "Заголовок выбранного маршрута",
    defaultValue: "Ваш выбранный маршрут",
  },
  {
    key: "escape.backup_options",
    group: "escape",
    label: "Запасные варианты",
    defaultValue: "Запасные варианты",
  },
  {
    key: "escape.active_goal",
    group: "escape",
    label: "Активная цель",
    defaultValue: "Активная цель",
  },
  {
    key: "escape.action_plan",
    group: "escape",
    label: "План действий",
    defaultValue: "План действий",
  },
  {
    key: "escape.direction_label",
    group: "escape",
    label: "Направление",
    defaultValue: "Направление:",
  },

  // Кнопки
  {
    key: "btn.try_option",
    group: "buttons",
    label: "Выбрать маршрут (запасные варианты)",
    defaultValue: "Выбрать этот маршрут",
  },
  {
    key: "btn.start_direction",
    group: "buttons",
    label: "Начать с направления (главная рекомендация)",
    defaultValue: "Начать с этого направления",
  },
  {
    key: "btn.change_route",
    group: "buttons",
    label: "Изменить маршрут",
    defaultValue: "Изменить маршрут",
  },
  {
    key: "btn.creating_plan",
    group: "buttons",
    label: "Создаём план…",
    defaultValue: "Создаём план…",
  },
  {
    key: "btn.done",
    group: "buttons",
    label: "Готово (шаг)",
    defaultValue: "Готово",
  },
  {
    key: "btn.all_actions",
    group: "buttons",
    label: "Все шаги в «Что делать»",
    defaultValue: "Все шаги в разделе «Что делать»",
  },
  {
    key: "btn.failed",
    group: "buttons",
    label: "Не получилось",
    defaultValue: "Не получилось",
  },
  {
    key: "btn.save",
    group: "buttons",
    label: "Сохранить",
    defaultValue: "Сохранить",
  },
  {
    key: "btn.reset_default",
    group: "buttons",
    label: "Сбросить к умолчанию",
    defaultValue: "Сбросить",
  },
];

export const SITE_COPY_DEFAULTS: Record<string, string> = Object.fromEntries(
  SITE_COPY_DEFINITIONS.map((item) => [item.key, item.defaultValue])
);

export const SITE_COPY_KEYS = new Set(
  SITE_COPY_DEFINITIONS.map((item) => item.key)
);

export function isSiteCopyKey(key: string): boolean {
  return SITE_COPY_KEYS.has(key);
}
