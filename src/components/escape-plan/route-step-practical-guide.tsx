"use client";

import { Button } from "@/components/ui/button";
import type { RouteStepGuide } from "@/lib/escape-plan/route-step-guides";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface RouteStepPracticalGuideProps {
  guide: RouteStepGuide;
}

export function RouteStepPracticalGuide({ guide }: RouteStepPracticalGuideProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyAdText() {
    try {
      await navigator.clipboard.writeText(guide.adText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 border-t border-border/50 pt-4">
      <section className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          Рекомендуемые площадки
        </h4>
        <div className="space-y-2">
          {guide.platforms.map((platform) => (
            <div
              key={platform.name}
              className="rounded-lg border border-border/60 bg-surface/40 p-3 space-y-1"
            >
              <p className="text-sm font-medium">{platform.name}</p>
              <p className="text-xs text-muted leading-relaxed">
                <span className="text-foreground/80">Почему подходит: </span>
                {platform.why}
              </p>
              <p className="text-xs text-muted leading-relaxed">
                <span className="text-foreground/80">Что разместить: </span>
                {platform.whatToPost}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-foreground">Текст объявления</h4>
          <Button type="button" size="sm" variant="secondary" onClick={handleCopyAdText}>
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Скопировать
              </>
            )}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg border border-border/60 bg-surface/40 p-3 text-xs text-foreground/90 leading-relaxed font-sans">
          {guide.adText}
        </pre>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">
          Что показать в портфолио
        </h4>
        <ul className="space-y-1.5 text-xs text-muted leading-relaxed list-disc pl-4">
          {guide.portfolioItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">
          Чтобы отметить шаг выполненным
        </h4>
        <ul className="space-y-1.5">
          {guide.checklist.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-xs text-foreground/85 leading-relaxed"
            >
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border/70 text-[10px] text-muted">
                ○
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
