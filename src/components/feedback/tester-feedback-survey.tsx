"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  TESTER_CLARITY_OPTIONS,
  TESTER_PAID_VALUE_OPTIONS,
  TESTER_USEFUL_PARTS_OPTIONS,
  type TesterClarity,
  type TesterPaidValuePart,
  type TesterUsefulPart,
} from "@/lib/feedback/tester-feedback-constants";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

const SESSION_KEY = "finpilot:tester_feedback_submitted";

function radioClass(checked: boolean) {
  return cn(
    "flex min-h-[44px] items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors",
    checked
      ? "border-accent/50 bg-accent/10 text-foreground"
      : "border-border hover:bg-surface-hover"
  );
}

function checkboxClass(checked: boolean) {
  return radioClass(checked);
}

export function TesterFeedbackSurvey() {
  const [submitted, setSubmitted] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SESSION_KEY) === "1";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [clarity, setClarity] = useState<TesterClarity | "">("");
  const [usefulParts, setUsefulParts] = useState<TesterUsefulPart[]>([]);
  const [usefulPartsOther, setUsefulPartsOther] = useState("");
  const [resonatedMoment, setResonatedMoment] = useState("");
  const [confusingParts, setConfusingParts] = useState("");
  const [nextStepsClear, setNextStepsClear] = useState<TesterClarity | "">("");
  const [missingToReturn, setMissingToReturn] = useState("");
  const [paidValueParts, setPaidValueParts] = useState<TesterPaidValuePart[]>([]);
  const [paidValuePartsOther, setPaidValuePartsOther] = useState("");
  const [contact, setContact] = useState("");

  function toggleUsefulPart(part: TesterUsefulPart) {
    setUsefulParts((prev) => {
      if (prev.includes(part)) {
        if (part === "Другое") setUsefulPartsOther("");
        return prev.filter((item) => item !== part);
      }
      return [...prev, part];
    });
  }

  function togglePaidValuePart(part: TesterPaidValuePart) {
    setPaidValueParts((prev) => {
      if (prev.includes(part)) {
        if (part === "Другое") setPaidValuePartsOther("");
        if (part === "Пока ни за что") {
          return prev.filter((item) => item !== part);
        }
        return prev.filter((item) => item !== part);
      }
      if (part === "Пока ни за что") {
        setPaidValuePartsOther("");
        return ["Пока ни за что"];
      }
      return [...prev.filter((item) => item !== "Пока ни за что"), part];
    });
  }

  const canSubmit =
    clarity !== "" &&
    nextStepsClear !== "" &&
    (!usefulParts.includes("Другое") || usefulPartsOther.trim().length > 0) &&
    (!paidValueParts.includes("Другое") || paidValuePartsOther.trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tester-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clarity,
          useful_parts: usefulParts,
          useful_parts_other: usefulPartsOther.trim() || undefined,
          resonated_moment: resonatedMoment.trim() || undefined,
          confusing_parts: confusingParts.trim() || undefined,
          next_steps_clear: nextStepsClear,
          missing_to_return: missingToReturn.trim() || undefined,
          paid_value_parts: paidValueParts,
          paid_value_parts_other: paidValuePartsOther.trim() || undefined,
          contact: contact.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Не удалось отправить отзыв");
      }

      sessionStorage.setItem(SESSION_KEY, "1");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить отзыв");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <div className="p-5 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-400">
              Спасибо! Ваш ответ поможет сделать ФинПилот полезнее.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Помог ли вам результат?</CardTitle>
        <CardDescription>
          Ответьте на несколько вопросов — это поможет улучшить ФинПилот для
          первых пользователей.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-6">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground/90">
            1. Был ли результат понятен?
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TESTER_CLARITY_OPTIONS.map((option) => (
              <label key={option} className={radioClass(clarity === option)}>
                <input
                  type="radio"
                  name="clarity"
                  checked={clarity === option}
                  onChange={() => setClarity(option)}
                  className="size-4 shrink-0"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground/90">
            2. Что оказалось самым полезным?
          </legend>
          <div className="grid grid-cols-1 gap-2">
            {TESTER_USEFUL_PARTS_OPTIONS.map((option) => (
              <label key={option} className={checkboxClass(usefulParts.includes(option))}>
                <input
                  type="checkbox"
                  checked={usefulParts.includes(option)}
                  onChange={() => toggleUsefulPart(option)}
                  className="size-4 shrink-0 rounded border-border"
                />
                {option}
              </label>
            ))}
          </div>
          {usefulParts.includes("Другое") && (
            <Input
              id="useful_parts_other"
              label="Уточните"
              value={usefulPartsOther}
              onChange={(e) => setUsefulPartsOther(e.target.value)}
              placeholder="Что ещё было полезным?"
            />
          )}
        </fieldset>

        <div className="space-y-2">
          <label
            htmlFor="resonated_moment"
            className="text-sm font-medium text-foreground/90 block"
          >
            3. Был ли момент, где вы подумали: «Да, это про меня»?
          </label>
          <textarea
            id="resonated_moment"
            className="w-full min-h-[100px] rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Например: описание проблемы, расходы, разрыв до цели, идея доп.дохода…"
            value={resonatedMoment}
            onChange={(e) => setResonatedMoment(e.target.value)}
            maxLength={2000}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confusing_parts"
            className="text-sm font-medium text-foreground/90 block"
          >
            4. Что было лишним, непонятным или неубедительным?
          </label>
          <textarea
            id="confusing_parts"
            className="w-full min-h-[100px] rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Напишите честно, что сбило с толку или показалось слабым."
            value={confusingParts}
            onChange={(e) => setConfusingParts(e.target.value)}
            maxLength={2000}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground/90">
            5. После диагностики стало понятнее, что делать дальше с деньгами?
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TESTER_CLARITY_OPTIONS.map((option) => (
              <label key={option} className={radioClass(nextStepsClear === option)}>
                <input
                  type="radio"
                  name="next_steps_clear"
                  checked={nextStepsClear === option}
                  onChange={() => setNextStepsClear(option)}
                  className="size-4 shrink-0"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label
            htmlFor="missing_to_return"
            className="text-sm font-medium text-foreground/90 block"
          >
            6. Чего не хватило, чтобы вы захотели вернуться в сервис ещё раз?
          </label>
          <textarea
            id="missing_to_return"
            className="w-full min-h-[100px] rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Например: больше конкретики, личный план, напоминания, сохранение истории, более точные идеи дохода…"
            value={missingToReturn}
            onChange={(e) => setMissingToReturn(e.target.value)}
            maxLength={2000}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground/90">
            7. За какую часть ФинПилота вы бы потенциально были готовы платить,
            если она будет доработана?
          </legend>
          <div className="grid grid-cols-1 gap-2">
            {TESTER_PAID_VALUE_OPTIONS.map((option) => (
              <label
                key={option}
                className={checkboxClass(paidValueParts.includes(option))}
              >
                <input
                  type="checkbox"
                  checked={paidValueParts.includes(option)}
                  onChange={() => togglePaidValuePart(option)}
                  className="size-4 shrink-0 rounded border-border"
                />
                {option}
              </label>
            ))}
          </div>
          {paidValueParts.includes("Другое") && (
            <Input
              id="paid_value_parts_other"
              label="Уточните"
              value={paidValuePartsOther}
              onChange={(e) => setPaidValuePartsOther(e.target.value)}
              placeholder="За что вы готовы платить?"
            />
          )}
        </fieldset>

        <Input
          id="tester_contact"
          label="8. Оставьте контакт, если можно задать уточняющий вопрос"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Telegram, email или другой контакт"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          className="w-full min-h-[44px] sm:w-auto"
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Отправка...
            </>
          ) : (
            "Отправить отзыв"
          )}
        </Button>
      </form>
    </Card>
  );
}
