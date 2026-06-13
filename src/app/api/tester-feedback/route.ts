import { createClient } from "@/lib/supabase/server";
import {
  TESTER_CLARITY_OPTIONS,
  TESTER_PAID_VALUE_OPTIONS,
  TESTER_USEFUL_PARTS_OPTIONS,
  type TesterFeedbackPayload,
} from "@/lib/feedback/tester-feedback-constants";
import { NextResponse } from "next/server";

function isClarity(value: unknown): value is TesterFeedbackPayload["clarity"] {
  return (
    typeof value === "string" &&
    (TESTER_CLARITY_OPTIONS as readonly string[]).includes(value)
  );
}

function filterOptions<T extends readonly string[]>(
  values: unknown,
  allowed: T
): T[number][] {
  if (!Array.isArray(values)) return [];
  return values.filter(
    (item): item is T[number] =>
      typeof item === "string" && (allowed as readonly string[]).includes(item)
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!isClarity(body.clarity) || !isClarity(body.next_steps_clear)) {
      return NextResponse.json(
        { error: "Ответьте на обязательные вопросы" },
        { status: 400 }
      );
    }

    const useful_parts = filterOptions(
      body.useful_parts,
      TESTER_USEFUL_PARTS_OPTIONS
    );
    const paid_value_parts = filterOptions(
      body.paid_value_parts,
      TESTER_PAID_VALUE_OPTIONS
    );

    const useful_parts_other =
      typeof body.useful_parts_other === "string"
        ? body.useful_parts_other.trim().slice(0, 2000)
        : null;
    const paid_value_parts_other =
      typeof body.paid_value_parts_other === "string"
        ? body.paid_value_parts_other.trim().slice(0, 2000)
        : null;

    if (useful_parts.includes("Другое") && !useful_parts_other) {
      return NextResponse.json(
        { error: "Уточните, что было полезным" },
        { status: 400 }
      );
    }

    if (paid_value_parts.includes("Другое") && !paid_value_parts_other) {
      return NextResponse.json(
        { error: "Уточните, за что вы готовы платить" },
        { status: 400 }
      );
    }

    const payload: TesterFeedbackPayload = {
      clarity: body.clarity,
      useful_parts,
      useful_parts_other: useful_parts_other || undefined,
      resonated_moment:
        typeof body.resonated_moment === "string"
          ? body.resonated_moment.trim().slice(0, 2000)
          : undefined,
      confusing_parts:
        typeof body.confusing_parts === "string"
          ? body.confusing_parts.trim().slice(0, 2000)
          : undefined,
      next_steps_clear: body.next_steps_clear,
      missing_to_return:
        typeof body.missing_to_return === "string"
          ? body.missing_to_return.trim().slice(0, 2000)
          : undefined,
      paid_value_parts,
      paid_value_parts_other: paid_value_parts_other || undefined,
      contact:
        typeof body.contact === "string"
          ? body.contact.trim().slice(0, 500)
          : undefined,
    };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("tester_feedback").insert({
      user_id: user?.id ?? null,
      contact: payload.contact || null,
      clarity: payload.clarity,
      useful_parts: payload.useful_parts,
      useful_parts_other: payload.useful_parts_other || null,
      resonated_moment: payload.resonated_moment || null,
      confusing_parts: payload.confusing_parts || null,
      next_steps_clear: payload.next_steps_clear,
      missing_to_return: payload.missing_to_return || null,
      paid_value_parts: payload.paid_value_parts,
      paid_value_parts_other: payload.paid_value_parts_other || null,
      answers: payload,
    });

    if (error) {
      console.error("[tester-feedback]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("tester-feedback route:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
