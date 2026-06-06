import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackServerEvent } from "@/lib/analytics/track-server";
import { trackProductEvent } from "@/lib/analytics/track-product";
import { getAnalysisContext } from "@/lib/actions/finance";
import { markOnboardingStep } from "@/lib/actions/onboarding";
import {
  computeIndexDelta,
  generateComparisonComment,
} from "@/lib/ai/generate-comparison";
import {
  buildAnalysisDataFlags,
  buildAnalysisGuardrailRules,
  buildAnalysisSystemPrompt,
  sanitizeAnalysisResult,
} from "@/lib/ai/analysis-guardrails";
import { createTasksFromAnalysis } from "@/lib/ai/create-tasks-from-analysis";
import { getGptunnelConfig, gptunnelChat } from "@/lib/ai/gptunnel";
import { PROBLEM_LABELS, resolveProblemLabel } from "@/lib/finance/problem-labels";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { AiAnalysisResult, AnalysisRecord } from "@/types/analysis";
import { NextResponse } from "next/server";

const ANALYSIS_SELECT =
  "id, user_id, financial_index, main_problem, main_problem_short, next_step, analysis_date, recommendations, model_used, index_delta, comparison_comment, created_at";

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

function buildAnalysisPrompt(
  context: Awaited<ReturnType<typeof getAnalysisContext>>,
  guardrailRules: string
) {
  const labels = PROBLEM_LABELS.join(" | ");

  return `
Проанализируй финансовые данные пользователя.
${guardrailRules}
Тип пользователя: ${context.profileTypeLabel}
Учитывай профиль при рекомендациях, задачах, следующем лучшем действии и оценке финансового здоровья.
Учти: monthlyIncome / planningMonthlyIncome — основной доход из профиля + дополнительные доходы месяца.
primaryMonthlyIncome — зарплата, пенсия, базовый доход самозанятого или средний доход бизнеса из онбординга.
additionalMonthlyIncome — подработка, аренда, премии и другие доп. источники.
actualMonthlyIncome — только дополнительные поступления, уже отмеченные в этом месяце (не уменьшай monthlyIncome, если зарплата указана в профиле).
НЕ рекомендуй «связаться с работодателем» или «вы не получили зарплату», если primaryMonthlyIncome > 0.
expectedMonthlyIncome — то же, что primaryMonthlyIncome.
average_month_income / expected_monthly_income — базовый сценарий (обычный месяц): среднее между плохим и хорошим месяцем, либо среднее за последние 3 месяца по истории.
bad_month_income и good_month_income — сценарии минимума и максимума.
income_gap = базовый сценарий - факт текущего месяца (сколько не хватает до обычного месяца).
income_scenario_source: history — прогноз по фактам за 3 месяца, profile — по настройкам плохого/хорошего месяца.
Плановые ожидания — не доходы. Не используй факт текущего месяца как прогноз будущих месяцев.
${JSON.stringify(context, null, 2)}

Ответь строго в JSON формате:
{
  "summary": "краткая диагностика текущего положения",
  "health_status": "good | bad | critical",
  "health_explanation": "если положение хорошее — объясни почему; если плохое — прямо и без смягчения",
  "main_problem_label": "короткая метка из списка: ${labels}",
  "main_threat": "развёрнутое описание главной угрозы (2-3 предложения)",
  "main_problem": "краткая формулировка главной проблемы",
  "money_leaks": ["утечка денег 1", "утечка денег 2"],
  "cash_gap_risk": {
    "level": "high | medium | low",
    "description": "риск кассового разрыва и его причины",
    "months_until_gap": 0
  },
  "risks": [
    { "level": "high | medium | low", "title": "название риска", "description": "описание" }
  ],
  "plan_7_days": [{ "action": "конкретное действие", "why": "зачем это срочно" }],
  "plan_30_days": [{ "action": "конкретное действие", "why": "ожидаемый эффект" }],
  "plan_90_days": [{ "action": "конкретное действие", "why": "стратегический эффект" }],
  "actions_30_days": [
    { "priority": "high | medium | low", "action": "конкретное действие", "effect": "ожидаемый эффект" }
  ],
  "next_best_action": {
    "title": "одно главное действие на ближайшие дни",
    "description": "почему именно оно",
    "impact_score": 85,
    "impact_label": "Сильно поможет",
    "due_days": 7
  },
  "debt_recommendation": "что делать с долгами",
  "cashflow_forecast_comment": "комментарий: сколько останется в месяц"
}

impact_label: "Немного поможет" | "Заметно поможет" | "Сильно поможет"
Пиши простым языком, без слов «денежный поток», «ликвидность», «долговая нагрузка».
actions_30_days — до 4 конкретных шагов на 30 дней.
next_best_action — самое важное действие прямо сейчас.
Не добавляй markdown. Верни только JSON.
`;
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/analyze" });
}

export async function POST(_req: Request) {
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

    await trackServerEvent({
      event_name: ANALYTICS_EVENTS.ANALYZE_STARTED,
      user_id: user.id,
      page_path: "/analyze",
    });
    await trackProductEvent(
      PRODUCT_EVENTS.ANALYSIS_STARTED,
      {},
      user.id
    );

    const context = await getAnalysisContext();
    const today = getTodayDateString();

    const [{ count: analysisCount }, { data: goals }, { data: expenses }] =
      await Promise.all([
        supabase
          .from("analyses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase.from("financial_goals").select("type, current_amount").eq("user_id", user.id),
        supabase
          .from("expenses")
          .select("title, category, amount, is_essential")
          .eq("user_id", user.id),
      ]);

    const dataFlags = buildAnalysisDataFlags({
      expenses: expenses ?? [],
      goals: goals ?? [],
      analysisCount: analysisCount ?? 0,
      profileType: context.profileType,
      primaryMonthlyIncome: context.primaryMonthlyIncome ?? 0,
    });
    const guardrailRules = buildAnalysisGuardrailRules(dataFlags);

    const chatResult = await gptunnelChat(
      [
        {
          role: "system",
          content: buildAnalysisSystemPrompt(
            context.profileTypeLabel,
            dataFlags
          ),
        },
        { role: "user", content: buildAnalysisPrompt(context, guardrailRules) },
      ],
      0.3
    );

    if (!chatResult.ok) {
      console.error("GPTunnel error:", chatResult.status, chatResult.details);
      return NextResponse.json(
        {
          error: chatResult.error,
          status: chatResult.status,
          details: chatResult.details,
        },
        { status: chatResult.status ?? 500 }
      );
    }

    const rawParsed = extractJsonFromText(chatResult.content) as AiAnalysisResult;
    const parsed = sanitizeAnalysisResult(rawParsed, dataFlags);
    console.log("Model used:", chatResult.model);

    const mainThreat =
      parsed.main_threat?.trim() ||
      parsed.main_problem?.trim() ||
      parsed.summary?.trim() ||
      "Не определена";
    const mainProblemShort = resolveProblemLabel(
      parsed.main_problem_label,
      mainThreat
    );
    const nextStep =
      parsed.next_best_action?.title?.trim() ??
      parsed.plan_7_days?.[0]?.action?.trim() ??
      null;

    await supabase
      .from("analyses")
      .delete()
      .eq("user_id", user.id)
      .eq("analysis_date", today);

    const { data: previousAnalysis } = await supabase
      .from("analyses")
      .select(ANALYSIS_SELECT)
      .eq("user_id", user.id)
      .lt("analysis_date", today)
      .order("analysis_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const indexDelta = previousAnalysis
      ? computeIndexDelta(
          context.financialIndex,
          previousAnalysis.financial_index
        )
      : null;

    const { data: saved, error: saveError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        financial_index: context.financialIndex,
        main_problem: mainThreat,
        main_problem_short: mainProblemShort,
        next_step: nextStep,
        analysis_date: today,
        recommendations: parsed,
        model_used: chatResult.model,
        index_delta: indexDelta,
      })
      .select("id")
      .single();

    if (saveError || !saved) {
      console.error("Failed to save analysis:", saveError);
      return NextResponse.json(parsed);
    }

    if (previousAnalysis) {
      const fullSaved = await supabase
        .from("analyses")
        .select(ANALYSIS_SELECT)
        .eq("id", saved.id)
        .single();

      if (fullSaved.data) {
        const comparisonComment = await generateComparisonComment(
          fullSaved.data as AnalysisRecord,
          previousAnalysis as AnalysisRecord
        );

        await supabase
          .from("analyses")
          .update({ comparison_comment: comparisonComment })
          .eq("id", saved.id);
      }
    }

    const taskResult = await createTasksFromAnalysis(
      supabase,
      user.id,
      saved.id,
      parsed
    );

    await markOnboardingStep("analysis");

    revalidatePath("/history");
    revalidatePath("/actions");
    revalidatePath("/dashboard");
    revalidatePath("/goals");
    revalidatePath("/simulator");

    await trackServerEvent({
      event_name: ANALYTICS_EVENTS.ANALYZE_COMPLETED,
      user_id: user.id,
      page_path: "/analyze",
      properties: {
        tasks_created: taskResult.created_tasks_count,
        tasks_updated: taskResult.updated_tasks_count,
        skipped_duplicate_tasks: taskResult.skipped_duplicate_tasks_count,
        index: context.financialIndex ?? null,
      },
    });
    await trackProductEvent(
      PRODUCT_EVENTS.ANALYSIS_COMPLETED,
      {
        analysis_id: saved.id,
        tasks_created: taskResult.created_tasks_count,
        index: context.financialIndex ?? null,
      },
      user.id
    );

    return NextResponse.json({
      ...parsed,
      created_tasks_count: taskResult.created_tasks_count,
      updated_tasks_count: taskResult.updated_tasks_count,
      skipped_duplicate_tasks_count: taskResult.skipped_duplicate_tasks_count,
      tasks_created: taskResult.created_tasks_count,
      analysis_id: saved.id,
    });
  } catch (error) {
    console.error("Analyze error:", error);

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await trackServerEvent({
          event_name: ANALYTICS_EVENTS.ANALYZE_FAILED,
          user_id: user.id,
          page_path: "/analyze",
        });
      }
    } catch {
      /* ignore tracking errors */
    }

    return NextResponse.json(
      {
        error: "Не удалось выполнить анализ",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
