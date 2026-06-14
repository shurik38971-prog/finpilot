"use client";

import { submitFeedbackMessage } from "@/lib/actions/feedback";
import { FEEDBACK_MESSAGE_TYPES } from "@/lib/feedback/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type MessageType = "idea" | "bug" | "confusion";

const VALID_TYPES = new Set<MessageType>(["idea", "bug", "confusion"]);

function FeedbackForm() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const initialType =
    typeParam && VALID_TYPES.has(typeParam as MessageType)
      ? (typeParam as MessageType)
      : null;

  const [selected, setSelected] = useState<MessageType | null>(initialType);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialType) setSelected(initialType);
  }, [initialType]);

  async function handleSubmit() {
    if (!selected || message.trim().length < 3) return;
    setLoading(true);
    setError("");
    try {
      await submitFeedbackMessage({ type: selected, message: message.trim() });
      setSent(true);
      setMessage("");
      setSelected(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось отправить сообщение"
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedMeta = FEEDBACK_MESSAGE_TYPES.find((t) => t.id === selected);

  return (
    <div>
      <PageHeader
        title="Обратная связь"
        description="Помогите нам сделать ФинПилот лучше для самозанятых"
      />

      {sent && (
        <Card className="mb-6 border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-base text-emerald-400">
              Спасибо!
            </CardTitle>
            <CardDescription>
              Мы читаем каждое сообщение и учитываем его при развитии продукта.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Что хотите рассказать?</CardTitle>
          <CardDescription>Выберите тип и напишите комментарий</CardDescription>
        </CardHeader>

        <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FEEDBACK_MESSAGE_TYPES.map(({ id, label, emoji }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSelected(id);
                  setSent(false);
                }}
                className={cn(
                  "rounded-xl border px-4 py-4 text-left transition-colors",
                  selected === id
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/40"
                )}
              >
                <span className="text-2xl block mb-2">{emoji}</span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {selected && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted">
                {selectedMeta?.emoji} {selectedMeta?.label}
              </p>
              <textarea
                className="w-full min-h-[140px] rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder={
                  selected === "idea"
                    ? "Опишите идею — что добавить или улучшить?"
                    : selected === "bug"
                      ? "Что пошло не так? Где и при каких действиях?"
                      : "Что было непонятно? На какой странице?"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                onClick={handleSubmit}
                disabled={loading || message.trim().length < 3}
              >
                {loading ? "Отправка..." : "Отправить"}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export function FeedbackPageClient() {
  return (
    <Suspense>
      <FeedbackForm />
    </Suspense>
  );
}
