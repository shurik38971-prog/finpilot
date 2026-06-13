export type AdminFieldType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "select"
  | "json"
  | "textarea";

export interface AdminFieldSchema {
  key: string;
  label: string;
  type: AdminFieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  hideInTable?: boolean;
  createOnly?: boolean;
}

export interface AdminEntitySchema {
  key: string;
  table: string;
  label: string;
  labelPlural: string;
  idKey?: string;
  userScoped: boolean;
  singleton?: boolean;
  readonly?: boolean;
  fields: AdminFieldSchema[];
}

const BOOL = (key: string, label: string): AdminFieldSchema => ({
  key,
  label,
  type: "boolean",
});

const PROFILE_TYPES = [
  { value: "stable_salary", label: "Стабильная зарплата" },
  { value: "variable_income", label: "Нестабильный доход" },
  { value: "self_employed", label: "Самозанятый / ИП" },
  { value: "freelancer", label: "Фрилансер" },
];

export const ADMIN_ENTITY_SCHEMAS: AdminEntitySchema[] = [
  {
    key: "incomes",
    table: "incomes",
    label: "Доход",
    labelPlural: "Доходы",
    userScoped: true,
    fields: [
      { key: "title", label: "Название", type: "text", required: true },
      { key: "amount", label: "Сумма", type: "number", required: true },
      { key: "category", label: "Категория", type: "text", required: true },
      { key: "date", label: "Дата", type: "date", required: true },
      {
        key: "income_type",
        label: "Тип",
        type: "select",
        options: [
          { value: "expected", label: "Ожидаемый" },
          { value: "actual", label: "Фактический" },
        ],
      },
      BOOL("is_recurring", "Повторяющийся"),
      {
        key: "frequency",
        label: "Периодичность",
        type: "select",
        options: [
          { value: "", label: "—" },
          { value: "weekly", label: "Еженедельно" },
          { value: "monthly", label: "Ежемесячно" },
          { value: "quarterly", label: "Ежеквартально" },
          { value: "yearly", label: "Ежегодно" },
        ],
      },
      BOOL("is_additional", "Дополнительный"),
      BOOL("is_profile_parameter", "Параметр профиля"),
    ],
  },
  {
    key: "expenses",
    table: "expenses",
    label: "Расход",
    labelPlural: "Расходы",
    userScoped: true,
    fields: [
      { key: "title", label: "Название", type: "text", required: true },
      { key: "amount", label: "Сумма", type: "number", required: true },
      { key: "category", label: "Категория", type: "text", required: true },
      { key: "date", label: "Дата", type: "date", required: true },
      BOOL("is_recurring", "Повторяющийся"),
      {
        key: "frequency",
        label: "Периодичность",
        type: "select",
        options: [
          { value: "", label: "—" },
          { value: "weekly", label: "Еженедельно" },
          { value: "monthly", label: "Ежемесячно" },
          { value: "quarterly", label: "Ежеквартально" },
          { value: "yearly", label: "Ежегодно" },
        ],
      },
      BOOL("is_essential", "Обязательный"),
    ],
  },
  {
    key: "debts",
    table: "debts",
    label: "Долг",
    labelPlural: "Долги",
    userScoped: true,
    fields: [
      { key: "title", label: "Название", type: "text", required: true },
      { key: "total_amount", label: "Сумма долга", type: "number", required: true },
      {
        key: "remaining_amount",
        label: "Остаток",
        type: "number",
        required: true,
      },
      { key: "interest_rate", label: "Ставка %", type: "number" },
      { key: "minimum_payment", label: "Платёж", type: "number" },
      { key: "term_months", label: "Срок (мес.)", type: "number" },
      {
        key: "payment_type",
        label: "Тип платежа",
        type: "select",
        options: [
          { value: "annuity", label: "Аннуитет" },
          { value: "manual", label: "Вручную" },
        ],
      },
      { key: "due_day", label: "День платежа", type: "number" },
      { key: "priority", label: "Приоритет", type: "number" },
    ],
  },
  {
    key: "financial_goals",
    table: "financial_goals",
    label: "Цель",
    labelPlural: "Цели",
    userScoped: true,
    fields: [
      {
        key: "type",
        label: "Тип",
        type: "select",
        required: true,
        options: [
          { value: "safety_cushion", label: "Подушка" },
          { value: "debt_payoff", label: "Закрыть долг" },
          { value: "custom", label: "Своя" },
        ],
      },
      { key: "title", label: "Название", type: "text", required: true },
      { key: "target_amount", label: "Цель", type: "number", required: true },
      { key: "current_amount", label: "Накоплено", type: "number" },
      { key: "debt_id", label: "ID долга", type: "text", hideInTable: true },
      { key: "deadline", label: "Дедлайн", type: "date" },
    ],
  },
  {
    key: "financial_tasks",
    table: "financial_tasks",
    label: "Задача",
    labelPlural: "Задачи",
    userScoped: true,
    fields: [
      { key: "title", label: "Название", type: "text", required: true },
      { key: "description", label: "Описание", type: "textarea", hideInTable: true },
      { key: "explanation", label: "Пояснение", type: "textarea", hideInTable: true },
      {
        key: "status",
        label: "Статус",
        type: "select",
        options: [
          { value: "pending", label: "Активна" },
          { value: "done", label: "Выполнена" },
          { value: "postponed", label: "Отложена" },
          { value: "archived", label: "Архив" },
        ],
      },
      { key: "task_category", label: "Категория", type: "text" },
      { key: "priority_score", label: "Приоритет", type: "number" },
      { key: "financial_impact", label: "Эффект ₽", type: "number" },
      { key: "due_date", label: "Срок", type: "date" },
      { key: "escape_plan_id", label: "Escape plan ID", type: "text", hideInTable: true },
    ],
  },
  {
    key: "user_profiles",
    table: "user_profiles",
    label: "Профиль",
    labelPlural: "Профиль",
    idKey: "user_id",
    userScoped: true,
    singleton: true,
    fields: [
      {
        key: "profile_type",
        label: "Тип профиля",
        type: "select",
        options: [{ value: "", label: "—" }, ...PROFILE_TYPES],
      },
      { key: "average_month_income", label: "Средний доход", type: "number" },
      { key: "bad_month_income", label: "Плохой месяц", type: "number" },
      { key: "good_month_income", label: "Хороший месяц", type: "number" },
      {
        key: "expected_monthly_income",
        label: "Ожидаемый доход",
        type: "number",
      },
      BOOL("use_actual_income_only", "Только фактический доход"),
      BOOL("privacy_accepted", "Согласие с политикой"),
    ],
  },
  {
    key: "onboarding_progress",
    table: "onboarding_progress",
    label: "Онбординг",
    labelPlural: "Онбординг",
    idKey: "user_id",
    userScoped: true,
    singleton: true,
    fields: [
      BOOL("profile_done", "Профиль"),
      BOOL("income_done", "Доходы"),
      BOOL("expenses_done", "Расходы"),
      BOOL("debts_done", "Долги"),
      BOOL("goal_done", "Цель"),
      BOOL("analysis_done", "Анализ"),
      BOOL("completed", "Завершён"),
    ],
  },
  {
    key: "user_capabilities",
    table: "user_capabilities",
    label: "Анкета",
    labelPlural: "Анкета возможностей",
    userScoped: true,
    singleton: true,
    idKey: "id",
    fields: [
      { key: "current_work", label: "Работа", type: "text" },
      { key: "primary_goal", label: "Главная цель", type: "text" },
      { key: "custom_goal", label: "Своя цель", type: "text" },
      { key: "custom_restriction", label: "Ограничение", type: "text" },
      {
        key: "available_hours_per_week",
        label: "Часов в неделю",
        type: "number",
      },
      { key: "preferred_format", label: "Формат", type: "text" },
      { key: "skills", label: "Навыки (JSON)", type: "json", hideInTable: true },
      {
        key: "constraints",
        label: "Ограничения (JSON)",
        type: "json",
        hideInTable: true,
      },
      {
        key: "secondary_goals",
        label: "Доп. цели (JSON)",
        type: "json",
        hideInTable: true,
      },
      {
        key: "custom_skills",
        label: "Свои навыки (JSON)",
        type: "json",
        hideInTable: true,
      },
      { key: "last_plan", label: "План (JSON)", type: "json", hideInTable: true },
      {
        key: "last_rescue_plan",
        label: "План спасения (JSON)",
        type: "json",
        hideInTable: true,
      },
    ],
  },
  {
    key: "user_escape_plans",
    table: "user_escape_plans",
    label: "Попытка выхода",
    labelPlural: "Попытки выхода",
    userScoped: true,
    fields: [
      { key: "option_title", label: "Вариант", type: "text", required: true },
      {
        key: "status",
        label: "Статус",
        type: "select",
        options: [
          { value: "active", label: "Активен" },
          { value: "alternative", label: "Альтернатива" },
          { value: "archived", label: "В архиве" },
          { value: "completed", label: "Завершён" },
          { value: "planned", label: "Запланирован (устар.)" },
          { value: "abandoned", label: "Отменён (устар.)" },
        ],
      },
      {
        key: "attempt_status",
        label: "Попытка",
        type: "select",
        options: [
          { value: "not_started", label: "Не начата" },
          { value: "in_progress", label: "В процессе" },
          { value: "success", label: "Успех" },
          { value: "failed", label: "Неудача" },
        ],
      },
      { key: "active_goal", label: "Активная цель", type: "text" },
      { key: "income_found", label: "Найден доход", type: "number" },
      {
        key: "failure_reason",
        label: "Причина неудачи",
        type: "select",
        options: [
          { value: "", label: "—" },
          { value: "no_clients", label: "Нет клиентов" },
          { value: "no_portfolio", label: "Нет портфолио" },
          { value: "no_time", label: "Нет времени" },
          { value: "other", label: "Другое" },
        ],
      },
      {
        key: "failure_reason_other",
        label: "Причина (текст)",
        type: "text",
        hideInTable: true,
      },
      {
        key: "option_snapshot",
        label: "Снимок (JSON)",
        type: "json",
        hideInTable: true,
      },
    ],
  },
  {
    key: "analyses",
    table: "analyses",
    label: "Анализ",
    labelPlural: "Анализы",
    userScoped: true,
    fields: [
      { key: "financial_index", label: "Индекс", type: "number" },
      { key: "main_problem", label: "Проблема", type: "textarea" },
      { key: "main_problem_short", label: "Кратко", type: "text" },
      { key: "next_step", label: "Следующий шаг", type: "text" },
      { key: "analysis_date", label: "Дата", type: "date" },
      { key: "model_used", label: "Модель", type: "text", hideInTable: true },
      {
        key: "recommendations",
        label: "Рекомендации (JSON)",
        type: "json",
        hideInTable: true,
      },
    ],
  },
  {
    key: "feedback",
    table: "feedback",
    label: "Отзыв",
    labelPlural: "Отзывы (legacy)",
    userScoped: true,
    singleton: true,
    readonly: false,
    fields: [
      { key: "rating_score", label: "Оценка", type: "number" },
      { key: "confusion_text", label: "Путаница", type: "textarea" },
      { key: "most_useful_feature", label: "Полезное", type: "text" },
      { key: "missing_feature", label: "Не хватает", type: "textarea" },
      { key: "took_action", label: "Действие", type: "boolean" },
      { key: "action_description", label: "Описание", type: "textarea" },
    ],
  },
  {
    key: "feedback_messages",
    table: "feedback_messages",
    label: "Сообщение",
    labelPlural: "Сообщения",
    userScoped: true,
    fields: [
      {
        key: "type",
        label: "Тип",
        type: "select",
        options: [
          { value: "idea", label: "Идея" },
          { value: "bug", label: "Баг" },
          { value: "confusion", label: "Путаница" },
        ],
      },
      { key: "message", label: "Текст", type: "textarea", required: true },
    ],
  },
  {
    key: "user_feedback",
    table: "user_feedback",
    label: "Обратная связь",
    labelPlural: "Обратная связь",
    userScoped: true,
    fields: [
      {
        key: "feedback_type",
        label: "Тип",
        type: "select",
        options: [
          { value: "question", label: "Вопрос" },
          { value: "confusion", label: "Путаница" },
          { value: "idea", label: "Идея" },
        ],
      },
      { key: "message", label: "Сообщение", type: "textarea", required: true },
      { key: "page_path", label: "Страница", type: "text" },
    ],
  },
];

export function getEntitySchema(key: string): AdminEntitySchema | undefined {
  return ADMIN_ENTITY_SCHEMAS.find((schema) => schema.key === key);
}

export function getEntitySchemaByTable(
  table: string
): AdminEntitySchema | undefined {
  return ADMIN_ENTITY_SCHEMAS.find((schema) => schema.table === table);
}
