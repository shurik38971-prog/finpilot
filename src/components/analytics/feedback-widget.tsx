"use client";

import { getAnalyticsSessionId } from "@/lib/analytics/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { HelpCircle, Lightbulb, MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

type FeedbackType = "question" | "confusion" | "idea";

const TYPES: { id: FeedbackType; label: string; icon: typeof HelpCircle }[] = [
  { id: "question", label: "Вопрос", icon: MessageCircle },
  { id: "confusion", label: "Не понял", icon: HelpCircle },
  { id: "idea", label: "Идея", icon: Lightbulb },
];

interface FeedbackWidgetProps {
  hidden?: boolean;
}

export function FeedbackWidget({ hidden = false }: FeedbackWidgetProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState<FeedbackType>("question");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  async function handleSubmit() {
    if (message.trim().length < 3) return;
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback_type: type,
          message: message.trim(),
          page_path: pathname,
          session_id: getAnalyticsSessionId(),
        }),
      });
      if (res.ok) {
        setSent(true);
        setMessage("");
        setTimeout(() => {
          setOpen(false);
          setSent(false);
          setExpanded(false);
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!hidden && !open && (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-5 sm:right-5">
          {expanded && (
            <div className="rounded-lg border border-border bg-surface shadow-lg p-2 text-sm animate-in fade-in max-w-[min(100vw-2rem,280px)]">
              <p className="text-foreground/80 px-2 py-1 text-xs">Что-то непонятно?</p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full justify-start"
                onClick={() => {
                  setType("confusion");
                  setOpen(true);
                  setExpanded(false);
                }}
              >
                <HelpCircle className="h-4 w-4" />
                Не понял, как это работает
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setType("question");
                  setOpen(true);
                  setExpanded(false);
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Задать вопрос
              </Button>
            </div>
          )}

          <Button
            size="sm"
            className={cn(
              "rounded-full shadow-lg",
              "h-12 w-12 p-0 sm:h-11 sm:w-auto sm:px-4 sm:gap-1.5"
            )}
            onClick={() => {
              setExpanded((v) => !v);
            }}
            data-analytics-id="feedback-fab"
            data-analytics-label="Кнопка обратной связи"
            aria-label="Помощь"
          >
            {expanded ? (
              <X className="h-5 w-5" />
            ) : (
              <MessageCircle className="h-5 w-5" />
            )}
            <span className="hidden sm:inline">Помощь</span>
          </Button>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Расскажите, что непонятно"
      >
        {sent ? (
          <p className="text-sm text-emerald-400 py-4">Спасибо! Мы учтём это.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {TYPES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setType(id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    type === id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder={
                type === "confusion"
                  ? "Что именно вызвало затруднение на этой странице?"
                  : type === "idea"
                    ? "Что бы вы хотели видеть в FinPilot?"
                    : "Ваш вопрос..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
            />
            <p className="text-xs text-muted">Страница: {pathname}</p>
            <Button
              onClick={handleSubmit}
              disabled={loading || message.trim().length < 3}
              className="w-full"
            >
              {loading ? "Отправка..." : "Отправить"}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
