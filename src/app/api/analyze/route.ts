import { getAnalysisContext } from "@/lib/actions/finance";
import {
  computeIndexDelta,
  generateComparisonComment,
} from "@/lib/ai/generate-comparison";
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

function buildAnalysisPrompt(context: Awaited<ReturnType<typeof getAnalysisContext>>) {
  const labels = PROBLEM_LABELS.join(" | ");

  return `
Проанализируй финансовые данные самозанятого:
${JSON.stringify(context, null, 2)}

Ответь строго в JSON формате:
{
  "summary": "краткая диагностика текущего положения",
  "health_status": "good | bad | critical",
  "health_explanation": "если положение хорошее — объясни почему; если плохое — прямо и без смягчения",
  "main_problem_label": "короткая метка из списка: ${labels}",
  "main_threat": "развёрнутое описание главной угрозы (2-3 предложения)",
  "money_leaks": ["утечка денег 1", "утечка денег 2"],
  "cash_gap_risk": {
    "level": "high | medium | low",
    "description": "риск кассового разрыва и его причины",
    "months_until_gap": 0
  },
  "plan_7_days": [
    { "action": "конкретное действие", "why": "зачем это срочно" }
  ],
  "plan_30_days": [
    { "action": "конкретное действие", "why": "ожидаемый эффект" }
  ],
  "plan_90_days": [
    { "action": "конкретное действие", "why": "стратегический эффект" }
  ]
}

main_problem_label — строго короткая фраза для таблицы (до 5 слов).
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

    const context = await getAnalysisContext();
    const today = getTodayDateString();

    const chatResult = await gptunnelChat(
      [
        {
          role: "system",
          content: `Ты не консультант. Ты финансовый директор самозанятого с нестабильным доходом и долгами.
Твоя задача:
- найти главную угрозу;
- найти утечки денег;
- определить риск кассового разрыва;
- дать план на 7 дней;
- дать план на 30 дней;
- дать план на 90 дней.
Если финансовое положение хорошее — объясни почему.
Если плохое — не смягчай формулировки.
Отвечай только валидным JSON без markdown.`,
        },
        { role: "user", content: buildAnalysisPrompt(context) },
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

    const parsed = extractJsonFromText(chatResult.content) as AiAnalysisResult;
    console.log("Model used:", chatResult.model);

    const mainThreat =
      parsed.main_threat?.trim() || parsed.summary?.trim() || "Не определена";
    const mainProblemShort = resolveProblemLabel(
      parsed.main_problem_label,
      mainThreat
    );
    const nextStep = parsed.plan_7_days?.[0]?.action?.trim() ?? null;

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
      .select(ANALYSIS_SELECT)
      .single();

    if (saveError) {
      console.error("Failed to save analysis:", saveError);
    } else if (previousAnalysis && saved) {
      const comparisonComment = await generateComparisonComment(
        saved as AnalysisRecord,
        previousAnalysis as AnalysisRecord
      );

      await supabase
        .from("analyses")
        .update({ comparison_comment: comparisonComment })
        .eq("id", saved.id);
    }

    revalidatePath("/history");

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Analyze error:", error);

    return NextResponse.json(
      {
        error: "Не удалось выполнить анализ",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
