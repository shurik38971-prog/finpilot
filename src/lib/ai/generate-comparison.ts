import { gptunnelChat } from "@/lib/ai/gptunnel";
import {
  buildFallbackComparison,
  computeIndexDelta,
} from "@/lib/finance/analysis-comparison";
import { formatHistoryDate } from "@/lib/utils";
import type { AnalysisRecord } from "@/types/analysis";

export { computeIndexDelta };

export async function generateComparisonComment(
  current: AnalysisRecord,
  previous: AnalysisRecord
): Promise<string> {
  const currentIndex = current.financial_index;
  const previousIndex = previous.financial_index;
  const delta = computeIndexDelta(currentIndex, previousIndex);

  const metrics = {
    current_index: currentIndex,
    previous_index: previousIndex,
    delta,
  };

  const prompt = `
Сравни два финансовых анализа самозанятого (разные дни).

Метрики (обязательны к учёту):
${JSON.stringify(metrics, null, 2)}

Предыдущий анализ (${formatHistoryDate(previous.created_at)}):
- метка проблемы: ${previous.main_problem_short ?? previous.main_problem}
- подробности: ${previous.main_problem}

Текущий анализ (${formatHistoryDate(current.created_at)}):
- метка проблемы: ${current.main_problem_short ?? current.main_problem}
- подробности: ${current.main_problem}

Правила (строго):
- Если delta > 0 — с деньгами стало легче. НЕЛЬЗЯ писать, что стало хуже.
- Если delta < 0 — с деньгами стало сложнее. НЕЛЬЗЯ писать, что стало лучше.
- Если delta = 0 — оценка не изменилась, опиши смену проблемы или стабильность.
- Опирайся на цифры оценки денег, а не только на текст проблемы.
- Пиши простым языком, без жаргона (поток, ликвидность, нагрузка).

Напиши 1–2 предложения. Верни только текст, без JSON и markdown.
`;

  const result = await gptunnelChat(
    [
      {
        role: "system",
        content:
          "Ты помогаешь человеку понять, как изменилась его ситуация с деньгами. Пиши просто.",
      },
      { role: "user", content: prompt },
    ],
    0.2
  );

  if (!result.ok) {
    console.error("Comparison AI error:", {
      error: result.error,
      hasDetails: Boolean(result.details),
    });
    return buildFallbackComparison(current, previous, delta);
  }

  return result.content.trim();
}
