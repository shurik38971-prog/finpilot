import { getAnalysisContext } from "@/lib/actions/finance";
import {
  getUserCapabilities,
  saveEscapePlanResult,
} from "@/lib/actions/capabilities";
import {
  buildEscapePlanGuardrailRules,
  buildEscapePlanSystemPrompt,
  sanitizeEscapePlanResult,
} from "@/lib/ai/escape-plan-guardrails";
import { getGptunnelConfig, gptunnelChat } from "@/lib/ai/gptunnel";
import { getPrimaryFinancialRisk } from "@/lib/finance/primary-financial-risk";
import { getGoals } from "@/lib/actions/goals";
import { getFinancialData } from "@/lib/actions/finance";
import { getUserFinancialProfile } from "@/lib/actions/profile";
import { DEFAULT_PROFILE_TYPE } from "@/types/profile";
import {
  getFailedEscapeAttempts,
  syncFinancialMeasureTasks,
} from "@/lib/actions/escape-plans";
import { buildEscapeRankingContext } from "@/lib/escape-plan/capabilities-context";
import { buildRescuePlan } from "@/lib/escape-plan/build-rescue-plan";
import { rankAndSortEscapePlanOptions } from "@/lib/escape-plan/rank-options";
import {
  getEffectiveConstraints,
  getEffectiveSkills,
  resolvePrimaryGoal,
  resolveSecondaryGoals,
} from "@/types/escape-plan";
import { ESCAPE_FAILURE_REASONS } from "@/types/rescue-plan";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

function extractJsonFromText(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("ИИ вернул ответ без JSON");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function buildFailedAttemptsBlock(
  attempts: Awaited<ReturnType<typeof getFailedEscapeAttempts>>
): string {
  if (attempts.length === 0) return "Нет.";
  const labels = Object.fromEntries(
    ESCAPE_FAILURE_REASONS.map((item) => [item.value, item.label])
  );
  return attempts
    .map((attempt) => {
      const reason =
        labels[attempt.failure_reason ?? "other"] ?? attempt.failure_reason;
      const extra = attempt.failure_reason_other
        ? ` (${attempt.failure_reason_other})`
        : "";
      return `- «${attempt.option_title}»: ${reason}${extra}. Не предлагай похожий путь без учёта причины.`;
    })
    .join("\n");
}

function buildEscapePlanPrompt(input: {
  financial: Awaited<ReturnType<typeof getAnalysisContext>>;
  capabilities: NonNullable<Awaited<ReturnType<typeof getUserCapabilities>>>;
  mainProblem: string | null;
  guardrailRules: string;
  failedAttempts: Awaited<ReturnType<typeof getFailedEscapeAttempts>>;
}) {
  const { financial, capabilities, mainProblem, guardrailRules, failedAttempts } =
    input;
  const primaryGoal = resolvePrimaryGoal(capabilities);
  const secondaryGoals = resolveSecondaryGoals(capabilities);
  const standardSkills = capabilities.skills.filter((s) => s !== "Другое");
  const customSkills = capabilities.custom_skills ?? [];
  const effectiveConstraints = getEffectiveConstraints(capabilities);

  return `
Подбери реалистичные варианты улучшения финансовой ситуации для этого пользователя.

${guardrailRules}

ФИНАНСЫ:
${JSON.stringify(financial, null, 2)}

ГЛАВНАЯ ПРОБЛЕМА:
${mainProblem ?? "не определена"}

АНКЕТА ВОЗМОЖНОСТЕЙ:
- Чем занимается: ${capabilities.current_work ?? "не указано"}
- Навыки (стандартные): ${standardSkills.join(", ") || "не указаны"}
- Навыки (свои, указал пользователь): ${customSkills.length > 0 ? customSkills.join(", ") : "нет"}
- Все навыки для подбора: ${getEffectiveSkills(capabilities).join(", ") || "не указаны"}
- Часов в неделю: ${capabilities.available_hours_per_week ?? "не указано"}
- Ограничения: ${effectiveConstraints.join(", ") || "нет"}
${capabilities.custom_restriction ? `- Своё ограничение: ${capabilities.custom_restriction}` : ""}

ЦЕЛИ (главная важнее дополнительных):
- Главная цель: ${primaryGoal}
- Дополнительные цели: ${secondaryGoals.length > 0 ? secondaryGoals.join(", ") : "не указаны"}
${capabilities.custom_goal ? `- Своя дополнительная цель: ${capabilities.custom_goal}` : ""}

Свободный остаток (netCashFlow): ${financial.netCashFlow} ₽/мес.
Если netCashFlow отрицательный, needed_amount ≈ модуль дефицита.

Приоритет рекомендаций:
1. Сначала варианты на основе УКАЗАННЫХ навыков пользователя — особенно профессиональных (разработка, дизайн, маркетинг, тексты, компьютеры)
2. НЕ предлагай физический труд (переезды, сборка мебели, велоремонт, грузчик), если навыки пользователя цифровые/профессиональные
3. Главная цель: «${primaryGoal}»; дополнительные: ${secondaryGoals.join(", ") || "нет"}
4. Случайные подработки без связи с навыками — только если навыки не применимы
5. Если есть customSkills или customGoal — обязательно учитывай их при выборе вариантов и пиши в why_chosen, почему вариант связан с ними
6. НЕ используй термины «индекс», «score», «рейтинг», «AI», «модель»
7. Каждый вариант должен отвечать: почему подходит именно этому человеку; сколько денег может дать; как приблизит к цели; какой первый шаг сегодня

НЕ СРАБОТАВШИЕ ПОПЫТКИ (учитывай при рекомендациях):
${buildFailedAttemptsBlock(failedAttempts)}

Ответь строго JSON:
{
  "situation_summary": "ровно 2 коротких предложения: сколько остаётся после расходов/долгов и что мешает целям",
  "needed_amount": 15000,
  "main_strategy": "главное направление одной фразой",
  "goals_focus": "одно предложение: почему рекомендации сфокусированы на главной цели",
  "options": [
    {
      "title": "название",
      "type": "increase_income | reduce_expenses | debt_action",
      "why_fits": "одно короткое предложение",
      "why_chosen": ["Уже есть навык", "Можно начать сразу", "Без вложений"],
      "first_step": "один конкретный шаг на сегодня",
      "action_steps": ["шаг 1 только для этого варианта", "шаг 2", "шаг 3"],
      "risk": "одна короткая фраза",
      "income_min": 5000,
      "income_max": 15000,
      "confidence": "high | medium | low",
      "difficulty": "low | medium | high",
      "time_required": "коротко, например: 5 ч/нед",
      "priority_rank": 1,
      "route_type": "consulting_training | on_site_service | remote_service | freelance_project | cashback_partner | resale_trade | simple_side_job",
      "user_skill": "plumbing | computers | web_development | repair | sales | other",
      "earning_format": "consulting_training | on_site_services | remote_services | freelance_project | cashback_partner | resale_trade | simple_side_job"
    }
  ],
  "not_recommended": [
    {
      "title": "что не делать",
      "why_not": "явная причина с привязкой к данным пользователя",
      "reason_type": "not_worth | not_suitable (not_suitable — если конфликт с ограничениями пользователя)"
    }
  ],
  "plan_7_days": ["шаг 1", "шаг 2"]
}

options — от 3 до 5 штук, отсортированы по priority_rank (1 = самый вероятный и быстрый).
action_steps — только шаги выбранного варианта, без шагов из других направлений.
income_min/income_max — реалистичная вилка в рублях в месяц, не точная цифра.
Не добавляй markdown.`;
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/escape-plan" });
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = getGptunnelConfig();
    if (!config.ok) {
      return NextResponse.json({ error: config.error }, { status: 500 });
    }

    const capabilities = await getUserCapabilities();
    if (!capabilities) {
      return NextResponse.json(
        { error: "Сначала заполните анкету возможностей" },
        { status: 400 }
      );
    }

    if (!resolvePrimaryGoal(capabilities)) {
      return NextResponse.json(
        { error: "Укажите главную цель" },
        { status: 400 }
      );
    }

    if (getEffectiveSkills(capabilities).length === 0) {
      return NextResponse.json(
        { error: "Укажите хотя бы один навык" },
        { status: 400 }
      );
    }

    const [
      financial,
      { incomes, expenses, debts, profileIncome },
      financialProfile,
      goals,
      failedAttempts,
    ] = await Promise.all([
      getAnalysisContext(),
      getFinancialData(),
      getUserFinancialProfile(),
      getGoals(),
      getFailedEscapeAttempts().catch(() => []),
    ]);

    const profileType = financialProfile.profileType ?? DEFAULT_PROFILE_TYPE;
    const mainProblem = getPrimaryFinancialRisk(
      incomes,
      expenses,
      debts,
      goals,
      profileType,
      profileIncome
    );

    const fallbackNeeded = Math.max(0, -financial.netCashFlow);
    const guardrailRules = buildEscapePlanGuardrailRules(
      getEffectiveConstraints(capabilities)
    );

    const chatResult = await gptunnelChat(
      [
        { role: "system", content: buildEscapePlanSystemPrompt() },
        {
          role: "user",
          content: buildEscapePlanPrompt({
            financial,
            capabilities,
            mainProblem,
            guardrailRules,
            failedAttempts,
          }),
        },
      ],
      0.35
    );

    if (!chatResult.ok) {
      return NextResponse.json(
        { error: chatResult.error, details: chatResult.details },
        { status: chatResult.status ?? 500 }
      );
    }

    const raw = extractJsonFromText(chatResult.content);
    const plan = sanitizeEscapePlanResult(
      raw,
      fallbackNeeded,
      buildEscapeRankingContext(capabilities)
    );

    if (plan.options.length === 0) {
      return NextResponse.json(
        { error: "Не удалось сформировать варианты — попробуйте ещё раз" },
        { status: 502 }
      );
    }

    const rankedOptions = rankAndSortEscapePlanOptions(
      plan.options,
      buildEscapeRankingContext(capabilities)
    );
    const rescuePlan = buildRescuePlan({
      monthlyIncome: financial.monthlyIncome,
      netCashFlow: financial.netCashFlow,
      totalDebt: financial.totalDebt,
      primaryGoal: resolvePrimaryGoal(capabilities),
      escapePlan: plan,
      topOption: rankedOptions[0] ?? null,
    });

    await saveEscapePlanResult(plan, rescuePlan);
    await syncFinancialMeasureTasks(plan.options);

    revalidatePath("/escape-plan");
    revalidatePath("/actions");
    revalidatePath("/dashboard");

    return NextResponse.json({ plan, rescuePlan });
  } catch (error) {
    console.error("escape-plan error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка генерации плана" },
      { status: 500 }
    );
  }
}
