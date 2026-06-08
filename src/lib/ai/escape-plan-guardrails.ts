import {
  sortEscapePlanOptions,
  type EscapePlanRankingContext,
} from "@/lib/escape-plan/sort-options";
import type {
  EscapePlanConfidence,
  EscapePlanDifficulty,
  EscapePlanOptionType,
  EscapePlanResult,
} from "@/types/escape-plan";

const OPTION_TYPES: EscapePlanOptionType[] = [
  "increase_income",
  "reduce_expenses",
  "debt_action",
];

const DIFFICULTIES: EscapePlanDifficulty[] = ["low", "medium", "high"];
const CONFIDENCES: EscapePlanConfidence[] = ["high", "medium", "low"];

export function buildEscapePlanSystemPrompt(): string {
  return `Ты — спокойный финансовый советник FinPilot. Помогаешь найти реалистичные варианты улучшения ситуации.

Тон: взрослый, конкретный, без мотивационных лозунгов. Не пиши «вы сможете всё», «у вас получится».
Пиши: «По вашим данным есть N реалистичных направления».

ЗАПРЕЩЕНО:
- обещать гарантированный заработок или точную сумму дохода
- советовать новый кредит или микрозайм как основной выход
- придумывать навыки, которых нет в анкете
- советовать физическую работу при ограничении «Не могу работать физически»
- советовать доставку на авто при «Нет автомобиля»
- советовать работу за компьютером при «Нет компьютера»
- звонки и холодные продажи при «Не хочу общаться по телефону»
- абстрактное «найдите подработку» без конкретики

ОБЯЗАТЕЛЬНО:
- why_chosen: 3–5 коротких причин с привязкой к навыкам, ограничениям и времени пользователя
- income_min и income_max: реалистичная вилка в рублях в месяц, не одна точная цифра
- confidence: high если навык есть и нет конфликтов; medium если нужна подготовка; low если долгий старт или высокая конкуренция
- предлагать варианты ТОЛЬКО на основе навыков из анкеты; не предлагать физический труд (переезды, сборка мебели, велоремонт), если у пользователя есть цифровые навыки (разработка, дизайн, маркетинг, тексты, компьютеры)
- not_recommended: явная причина, привязанная к данным пользователя
- 3–5 вариантов; итоговый порядок пересчитывается системой по навыкам и ограничениям

Ответ — только валидный JSON без markdown.`;
}

export function buildEscapePlanGuardrailRules(constraints: string[]): string {
  const rules: string[] = [];

  if (constraints.includes("Нет автомобиля")) {
    rules.push("НЕ предлагай такси, курьерскую доставку на авто, перевозки.");
  }
  if (constraints.includes("Нет компьютера")) {
    rules.push("НЕ предлагай удалённую работу за компьютером, фриланс на ПК.");
  }
  if (constraints.includes("Не хочу общаться по телефону")) {
    rules.push("НЕ предлагай холодные звонки, телемаркетинг, call-центр.");
  }
  if (constraints.includes("Не могу работать физически")) {
    rules.push("НЕ предлагай физический труд, грузчиков, разнорабочих.");
  }
  if (constraints.includes("Нужен удалённый формат")) {
    rules.push("Предпочитай удалённые или онлайн-варианты.");
  }
  if (constraints.includes("Только вечером")) {
    rules.push("Варианты должны быть совместимы с вечерним графиком.");
  }
  if (constraints.includes("Только выходные")) {
    rules.push("Варианты должны быть совместимы с работой только по выходным.");
  }

  return rules.length > 0 ? rules.map((r) => `- ${r}`).join("\n") : "- Особых ограничений нет.";
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\s/g, "").replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean).slice(0, 6);
}

function asOptionType(value: unknown): EscapePlanOptionType {
  if (OPTION_TYPES.includes(value as EscapePlanOptionType)) {
    return value as EscapePlanOptionType;
  }
  return "increase_income";
}

function asDifficulty(value: unknown): EscapePlanDifficulty {
  if (DIFFICULTIES.includes(value as EscapePlanDifficulty)) {
    return value as EscapePlanDifficulty;
  }
  return "medium";
}

function asConfidence(value: unknown): EscapePlanConfidence {
  if (CONFIDENCES.includes(value as EscapePlanConfidence)) {
    return value as EscapePlanConfidence;
  }
  return "medium";
}

function parseIncomeRange(o: Record<string, unknown>) {
  let incomeMin = asNumber(o.income_min);
  let incomeMax = asNumber(o.income_max);
  const legacy = asNumber(o.expected_effect);

  if (incomeMin <= 0 && incomeMax <= 0 && legacy > 0) {
    incomeMin = Math.round(legacy * 0.5);
    incomeMax = Math.round(legacy * 1.5);
  }

  if (incomeMin > incomeMax && incomeMax > 0) {
    [incomeMin, incomeMax] = [incomeMax, incomeMin];
  }

  if (incomeMin > 0 && incomeMax === 0) {
    incomeMax = Math.round(incomeMin * 1.5);
  }

  return { incomeMin, incomeMax };
}

export function sanitizeEscapePlanResult(
  raw: unknown,
  fallbackNeededAmount: number,
  rankingContext?: EscapePlanRankingContext
): EscapePlanResult {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const optionsRaw = Array.isArray(data.options) ? data.options : [];
  const options = sortEscapePlanOptions(
    optionsRaw.slice(0, 5).map((item) => {
      const o = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      const { incomeMin, incomeMax } = parseIncomeRange(o);
      const whyChosen = asStringArray(o.why_chosen);
      return {
        title: asString(o.title, "Вариант"),
        type: asOptionType(o.type),
        why_fits: asString(o.why_fits),
        why_chosen:
          whyChosen.length > 0
            ? whyChosen
            : [asString(o.why_fits)].filter(Boolean),
        first_step: asString(o.first_step),
        income_min: incomeMin,
        income_max: incomeMax,
        confidence: asConfidence(o.confidence),
        difficulty: asDifficulty(o.difficulty),
        time_required: asString(o.time_required),
        risk: asString(o.risk),
      };
    }),
    rankingContext
  );

  const notRecommendedRaw = Array.isArray(data.not_recommended)
    ? data.not_recommended
    : [];
  const not_recommended = notRecommendedRaw.slice(0, 4).map((item) => {
    const o = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const reason = asString(o.why_not) || asString(o.reason);
    const reasonType = o.reason_type === "not_suitable" ? "not_suitable" as const : "not_worth" as const;
    return {
      title: asString(o.title),
      reason,
      why_not: reason,
      reason_type: reasonType,
    };
  }).filter((item) => item.title && item.reason);

  const plan7Raw = Array.isArray(data.plan_7_days) ? data.plan_7_days : [];
  const plan_7_days = plan7Raw
    .slice(0, 7)
    .map((step) => asString(step))
    .filter(Boolean);

  return {
    situation_summary: asString(
      data.situation_summary,
      "Ситуация требует конкретных шагов — см. варианты ниже."
    ),
    needed_amount: asNumber(data.needed_amount, fallbackNeededAmount),
    main_strategy: asString(data.main_strategy),
    goals_focus: asString(data.goals_focus),
    options,
    not_recommended,
    plan_7_days,
  };
}
