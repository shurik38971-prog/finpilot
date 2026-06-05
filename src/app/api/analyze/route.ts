import { getAnalysisContext } from "@/lib/actions/finance";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY не настроен" },
        { status: 500 }
      );
    }

    const body = await getAnalysisContext();

    const prompt = `
Ты — строгий финансовый аналитик для самозанятого человека.

Проанализируй данные пользователя:
${JSON.stringify(body, null, 2)}

Ответь строго в JSON формате:
{
  "summary": "краткая диагностика",
  "main_problem": "главная проблема",
  "risks": [
    {
      "level": "high | medium | low",
      "title": "название риска",
      "description": "описание"
    }
  ],
  "actions_30_days": [
    {
      "priority": "high | medium | low",
      "action": "конкретное действие",
      "effect": "ожидаемый эффект"
    }
  ],
  "debt_recommendation": "что делать с долгами",
  "cashflow_forecast_comment": "комментарий по денежному потоку"
}
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://finpilot.vercel.app",
          "X-Title": "FinPilot",
        },
        body: JSON.stringify({
          model: "qwen/qwen3.6-plus",
          messages: [
            {
              role: "system",
              content:
                "Ты финансовый аналитик. Отвечай только валидным JSON без markdown.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Ошибка Qwen API", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Пустой ответ от ИИ" },
        { status: 500 }
      );
    }

    const cleanContent = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanContent);

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
