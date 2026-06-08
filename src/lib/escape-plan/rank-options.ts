import type { EscapePlanOption } from "@/types/escape-plan";

export interface EscapePlanRankingContext {
  skills: string[];
  constraints: string[];
  primaryGoal: string;
  secondaryGoals?: string[];
  customSkills?: string[];
  customGoal?: string | null;
}

/** Professional / digital skills — higher weight when matching options */
export const PROFESSIONAL_DIGITAL_SKILLS = [
  "Разработка сайтов",
  "Компьютеры",
  "Дизайн",
  "Тексты",
  "Маркетинг",
  "Фото / видео",
] as const;

const SKILL_KEYWORDS: Record<string, string[]> = {
  "Разработка сайтов": [
    "сайт",
    "веб",
    "разработ",
    "wordpress",
    "landing",
    "верстк",
    "frontend",
    "tilda",
    "html",
    "поддержк сайт",
  ],
  Компьютеры: [
    "компьютер",
    "it",
    "настройк",
    "поддержк",
    "админ",
    "софт",
    "программ",
    "техподдерж",
    "автоматизац",
  ],
  Дизайн: ["дизайн", "figma", "график", "иллюстра", "ui", "ux", "баннер", "макет"],
  Тексты: ["текст", "копирайт", "стать", "рерайт", "контент", "редактур", "перевод"],
  Маркетинг: ["маркетинг", "реклам", "smm", "таргет", "продвижен", "seo", "лид"],
  "Фото / видео": ["фото", "видео", "монтаж", "съёмк", "видеограф"],
  Продажи: ["продаж", "менеджер по продаж", "b2b", "b2c"],
  "Общение с людьми": ["консультац", "сопровожден", "клиент", "общени"],
  "Работа руками / ремонт": [
    "ремонт",
    "сборк",
    "мебел",
    "сантехник",
    "электрик",
    "мастер на час",
    "монтаж",
  ],
  Вождение: ["такси", "доставк", "перевоз", "водител", "курьер", "переезд"],
  Доставка: ["доставк", "курьер", "посылк"],
  Репетиторство: ["репетитор", "обучен", "урок", "преподав"],
  "Уход за животными": ["животн", "выгул", "груминг", "питомц"],
  Другое: [],
};

const PHYSICAL_LABOR_KEYWORDS = [
  "переезд",
  "переезды",
  "сборк",
  "мебел",
  "велоремонт",
  "велосипед",
  "грузчик",
  "разнорабоч",
  "физическ",
  "уборк",
  "дворник",
  "погрузк",
  "разгрузк",
  "строитель",
  "маляр",
];

const REMOTE_KEYWORDS = [
  "удалён",
  "удален",
  "онлайн",
  "дистанцион",
  "из дома",
  "freelance",
  "фриланс",
];

const PHONE_KEYWORDS = ["звонк", "телефон", "call-центр", "холодн", "телемаркет"];

const NO_INVESTMENT_KEYWORDS = [
  "без вложен",
  "без инвестиц",
  "не требует вложен",
  "бесплатн",
  "с нуля",
];

const GOAL_KEYWORDS: Record<string, string[]> = {
  "Закрыть долги": ["долг", "погас", "кредит", "займ", "платёж", "платеж", "доход"],
  "Создать подушку безопасности": ["подушк", "накоп", "резерв", "сбереж"],
  "Увеличить доход": ["доход", "заработ", "подработ", "фриланс", "клиент"],
  "Снизить расходы": ["расход", "эконом", "сократ", "бюджет", "оптимиз"],
  "Накопить на крупную покупку": ["накоп", "покупк", "цель", "доход"],
  "Улучшить финансовую стабильность": ["стабильн", "доход", "подушк", "дефицит"],
  "Снизить финансовый стресс": ["стресс", "стабильн", "доход", "подушк"],
};

const GOAL_TYPE_BONUS: Record<string, EscapePlanOption["type"][]> = {
  "Закрыть долги": ["increase_income", "debt_action"],
  "Создать подушку безопасности": ["increase_income", "reduce_expenses"],
  "Увеличить доход": ["increase_income"],
  "Снизить расходы": ["reduce_expenses"],
  "Накопить на крупную покупку": ["increase_income"],
  "Улучшить финансовую стабильность": ["increase_income", "reduce_expenses"],
  "Снизить финансовый стресс": ["increase_income", "reduce_expenses"],
};

function optionText(option: EscapePlanOption): string {
  return [
    option.title,
    option.why_fits,
    ...(option.why_chosen ?? []),
    option.first_step,
    option.time_required,
    option.risk,
  ]
    .join(" ")
    .toLowerCase();
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.filter((kw) => text.includes(kw)).length;
}

function userHasProfessionalDigitalSkills(skills: string[]): boolean {
  return skills.some((s) =>
    (PROFESSIONAL_DIGITAL_SKILLS as readonly string[]).includes(s)
  );
}

function isPhysicalLaborOption(text: string): boolean {
  return containsAny(text, PHYSICAL_LABOR_KEYWORDS);
}

function isDigitalOption(text: string): boolean {
  const digitalKeywords = [
    ...SKILL_KEYWORDS["Разработка сайтов"],
    ...SKILL_KEYWORDS["Компьютеры"],
    ...SKILL_KEYWORDS["Дизайн"],
    ...SKILL_KEYWORDS["Тексты"],
    ...SKILL_KEYWORDS["Маркетинг"],
    ...SKILL_KEYWORDS["Фото / видео"],
    ...REMOTE_KEYWORDS,
  ];
  return containsAny(text, digitalKeywords);
}

interface ScoreBreakdown {
  skill: number;
  income: number;
  speed: number;
  constraints: number;
  goal: number;
  professionalBonus: number;
  physicalPenalty: number;
}

function skillMatchKeywords(skill: string): string[] {
  const mapped = SKILL_KEYWORDS[skill];
  if (mapped && mapped.length > 0) return mapped;
  const lower = skill.toLowerCase();
  const words = lower.split(/[\s,/+-]+/).filter((w) => w.length >= 3);
  return [lower, ...words];
}

function scoreSkillMatch(
  text: string,
  skills: string[],
  customSkills: string[] = []
): { score: number; matched: string[] } {
  if (skills.length === 0) return { score: 0, matched: [] };

  let raw = 0;
  const matched: string[] = [];
  const maxPerSkill = 8;
  const customSet = new Set(customSkills.map((s) => s.toLowerCase()));

  for (const skill of skills) {
    if (skill === "Другое") continue;
    const keywords = skillMatchKeywords(skill);
    const hits = countMatches(text, keywords);
    if (hits > 0) {
      matched.push(skill);
      const isPro = (PROFESSIONAL_DIGITAL_SKILLS as readonly string[]).includes(skill);
      const isCustom = customSet.has(skill.toLowerCase());
      const weight = isPro ? 1.6 : isCustom ? 1.5 : 1;
      raw += Math.min(maxPerSkill, hits * 3) * weight;
    }
  }

  const maxRaw = skills.length * maxPerSkill * 1.6;
  const normalized = maxRaw > 0 ? (raw / maxRaw) * 35 : 0;
  return { score: Math.min(35, normalized), matched };
}

function scoreIncome(option: EscapePlanOption): number {
  const max = option.income_max > 0 ? option.income_max : option.income_min;
  if (max <= 0) return 3;
  if (max >= 80000) return 15;
  if (max >= 40000) return 12;
  if (max >= 20000) return 9;
  if (max >= 10000) return 6;
  return 4;
}

function scoreSpeed(option: EscapePlanOption, text: string): number {
  let score = 0;

  if (option.confidence === "high") score += 10;
  else if (option.confidence === "medium") score += 6;
  else score += 2;

  if (option.difficulty === "low") score += 6;
  else if (option.difficulty === "medium") score += 3;

  if (containsAny(text, ["сегодня", "завтра", "1-3 дн", "1–3 дн", "недел", "быстр"])) {
    score += 4;
  }

  return Math.min(20, score);
}

function scoreConstraints(text: string, constraints: string[]): number {
  let score = 20;

  if (constraints.includes("Нет компьютера") && isDigitalOption(text)) {
    score -= 18;
  }
  if (constraints.includes("Не могу работать физически") && isPhysicalLaborOption(text)) {
    score -= 18;
  }
  if (constraints.includes("Нет автомобиля")) {
    if (containsAny(text, ["такси", "курьер", "доставк на авто", "перевоз", "переезд"])) {
      score -= 16;
    }
  }
  if (constraints.includes("Не хочу общаться по телефону") && containsAny(text, PHONE_KEYWORDS)) {
    score -= 14;
  }
  if (constraints.includes("Нужен удалённый формат")) {
    if (isPhysicalLaborOption(text) && !containsAny(text, REMOTE_KEYWORDS)) {
      score -= 14;
    }
    if (containsAny(text, REMOTE_KEYWORDS)) {
      score += 4;
    }
  }
  if (constraints.includes("Только вечером") || constraints.includes("Только выходные")) {
    if (containsAny(text, ["гибк", "вечер", "выходн", "удалён", "удален", "фриланс"])) {
      score += 3;
    }
    if (containsAny(text, ["полный день", "смен", "офис с 9"])) {
      score -= 8;
    }
  }

  return Math.max(0, Math.min(20, score));
}

function scoreGoal(
  option: EscapePlanOption,
  text: string,
  primaryGoal: string,
  secondaryGoals: string[],
  customGoal?: string | null
): number {
  let score = 0;
  const goals = [primaryGoal, ...secondaryGoals];

  for (const goal of goals) {
    const types = GOAL_TYPE_BONUS[goal];
    if (types?.includes(option.type)) score += goal === primaryGoal ? 4 : 2;

    const keywords = GOAL_KEYWORDS[goal] ?? [];
    if (containsAny(text, keywords)) score += goal === primaryGoal ? 3 : 1;
    else if (!GOAL_KEYWORDS[goal]) {
      const words = goal.toLowerCase().split(/[\s,]+/).filter((w) => w.length >= 3);
      if (words.some((w) => text.includes(w))) {
        score += goal === primaryGoal ? 2 : 2;
      }
    }
  }

  if (customGoal?.trim()) {
    const words = customGoal.toLowerCase().split(/[\s,]+/).filter((w) => w.length >= 3);
    if (words.some((w) => text.includes(w))) score += 3;
  }

  return Math.min(10, score);
}

function buildRankReasons(
  breakdown: ScoreBreakdown,
  matchedSkills: string[],
  text: string,
  constraints: string[],
  option: EscapePlanOption,
  customSkills: string[] = [],
  customGoal?: string | null
): string[] {
  const reasons: string[] = [];

  const proMatched = matchedSkills.filter((s) =>
    (PROFESSIONAL_DIGITAL_SKILLS as readonly string[]).includes(s)
  );

  if (proMatched.length >= 2) {
    reasons.push("Максимально соответствует вашим навыкам");
  } else if (proMatched.length === 1) {
    reasons.push(`Опирается на навык «${proMatched[0]}»`);
  } else if (matchedSkills.length > 0) {
    reasons.push(`Совпадает с навыками: ${matchedSkills.slice(0, 2).join(", ")}`);
  }

  const customMatched = matchedSkills.filter((s) =>
    customSkills.some((c) => c.toLowerCase() === s.toLowerCase())
  );
  if (customMatched.length > 0) {
    reasons.push(`Опирается на ваш навык «${customMatched[0]}»`);
  }

  if (customGoal?.trim()) {
    const words = customGoal.toLowerCase().split(/[\s,]+/).filter((w) => w.length >= 3);
    if (words.some((w) => text.includes(w))) {
      reasons.push(`Помогает с вашей целью: ${customGoal.trim()}`);
    }
  }

  if (breakdown.professionalBonus > 0) {
    reasons.push("Использует вашу профессиональную экспертизу");
  }

  if (
    containsAny(text, NO_INVESTMENT_KEYWORDS) ||
    option.difficulty === "low"
  ) {
    reasons.push("Можно начать без вложений");
  }

  if (constraints.includes("Нужен удалённый формат") && containsAny(text, REMOTE_KEYWORDS)) {
    reasons.push("Подходит под удалённый формат");
  }

  if (
    constraints.includes("Не хочу общаться по телефону") &&
    !containsAny(text, PHONE_KEYWORDS)
  ) {
    reasons.push("Не требует звонков");
  }

  if (breakdown.income >= 9) {
    reasons.push("Высокий потенциал дохода");
  }

  if (breakdown.speed >= 14) {
    reasons.push("Быстрый старт — первые деньги раньше");
  }

  if (breakdown.constraints >= 16) {
    reasons.push("Соответствует вашим ограничениям");
  }

  if (breakdown.goal >= 5) {
    reasons.push("Помогает с главной целью");
  }

  if (breakdown.physicalPenalty < 0) {
    reasons.push("Ниже приоритет: не опирается на вашу основную экспертизу");
  }

  return reasons.slice(0, 5);
}

export function rankEscapePlanOption(
  option: EscapePlanOption,
  context: EscapePlanRankingContext
): { rank_score: number; rank_reasons: string[] } {
  const text = optionText(option);
  const {
    skills,
    constraints,
    primaryGoal,
    secondaryGoals = [],
    customSkills = [],
    customGoal,
  } = context;

  const { score: skillScore, matched } = scoreSkillMatch(text, skills, customSkills);
  const incomeScore = scoreIncome(option);
  const speedScore = scoreSpeed(option, text);
  const constraintsScore = scoreConstraints(text, constraints);
  const goalScore = scoreGoal(option, text, primaryGoal, secondaryGoals, customGoal);

  let professionalBonus = 0;
  let physicalPenalty = 0;

  const hasDigitalSkills = userHasProfessionalDigitalSkills(skills);

  if (hasDigitalSkills) {
    const proMatched = matched.some((s) =>
      (PROFESSIONAL_DIGITAL_SKILLS as readonly string[]).includes(s)
    );
    if (proMatched) professionalBonus = 12;
    if (isPhysicalLaborOption(text) && !proMatched) physicalPenalty = -20;
    if (isDigitalOption(text) && proMatched) professionalBonus += 5;
  }

  const breakdown: ScoreBreakdown = {
    skill: skillScore,
    income: incomeScore,
    speed: speedScore,
    constraints: constraintsScore,
    goal: goalScore,
    professionalBonus,
    physicalPenalty,
  };

  const rawTotal =
    skillScore +
    incomeScore +
    speedScore +
    constraintsScore +
    goalScore +
    professionalBonus +
    physicalPenalty;

  const rank_score = Math.max(5, Math.min(100, Math.round(rawTotal)));
  const rank_reasons = buildRankReasons(
    breakdown,
    matched,
    text,
    constraints,
    option,
    customSkills,
    customGoal
  );

  if (rank_reasons.length === 0) {
    rank_reasons.push("Умеренное соответствие вашему профилю");
  }

  return { rank_score, rank_reasons };
}

export type EscapeFitLevel = "excellent" | "good" | "low";

const FIT_LABELS: Record<EscapeFitLevel, string> = {
  excellent: "Подходит отлично",
  good: "Подходит хорошо",
  low: "Низкое соответствие",
};

export function getEscapeFitLabel(
  option: EscapePlanOption,
  index: number,
  total: number
): { level: EscapeFitLevel; label: string } {
  const score = option.rank_score ?? 0;
  let level: EscapeFitLevel;

  if (index === 0 || score >= 72) {
    level = "excellent";
  } else if (index <= 1 && score >= 48) {
    level = "good";
  } else if (score >= 55) {
    level = "good";
  } else if (index >= total - 1 && score < 40) {
    level = "low";
  } else if (score >= 38) {
    level = "good";
  } else {
    level = "low";
  }

  return { level, label: FIT_LABELS[level] };
}

export function rankAndSortEscapePlanOptions(
  options: EscapePlanOption[],
  context: EscapePlanRankingContext
): EscapePlanOption[] {
  const ranked = options.map((option, index) => {
    const { rank_score, rank_reasons } = rankEscapePlanOption(option, context);
    return {
      ...option,
      rank_score,
      rank_reasons,
      priority_rank: index + 1,
    };
  });

  ranked.sort((a, b) => {
    const scoreDiff = (b.rank_score ?? 0) - (a.rank_score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;

    const confWeight = { high: 3, medium: 2, low: 1 };
    const confDiff =
      (confWeight[b.confidence] ?? 2) - (confWeight[a.confidence] ?? 2);
    if (confDiff !== 0) return confDiff;

    return (b.income_max ?? 0) - (a.income_max ?? 0);
  });

  return ranked.map((option, index) => ({
    ...option,
    priority_rank: index + 1,
  }));
}
