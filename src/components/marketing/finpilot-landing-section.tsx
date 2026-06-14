"use client";

import { useCopy } from "@/components/copy/site-copy-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Compass, ListChecks, Search } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const VALUE_CARD_ICONS: LucideIcon[] = [Search, ListChecks, Compass];

const OUTCOME_COPY_KEYS = [
  "page.landing.outcome_1",
  "page.landing.outcome_2",
  "page.landing.outcome_3",
  "page.landing.outcome_4",
  "page.landing.outcome_5",
] as const;

export interface FinPilotLandingSectionProps {
  ctaHref: string;
  ctaCopyKey?: string;
  showCtaHint?: boolean;
  showOutcomes?: boolean;
  showIntro?: boolean;
  showBadge?: boolean;
  className?: string;
}

export function FinPilotLandingSection({
  ctaHref,
  ctaCopyKey = "page.landing.cta",
  showCtaHint = false,
  showOutcomes = false,
  showIntro = false,
  showBadge = false,
  className,
}: FinPilotLandingSectionProps) {
  const badge = useCopy("page.landing.badge");
  const title = useCopy("page.dashboard.title");
  const subtitle = useCopy("page.dashboard.hero_subtitle");
  const intro = useCopy("page.landing.intro");
  const audience = useCopy("page.dashboard.hero_audience");
  const cta = useCopy(ctaCopyKey);
  const ctaHint = useCopy("page.landing.cta_hint");
  const outcomesTitle = useCopy("page.landing.outcomes_title");
  const card1Title = useCopy("page.dashboard.value_card_1_title");
  const card1Text = useCopy("page.dashboard.value_card_1_text");
  const card2Title = useCopy("page.dashboard.value_card_2_title");
  const card2Text = useCopy("page.dashboard.value_card_2_text");
  const card3Title = useCopy("page.dashboard.value_card_3_title");
  const card3Text = useCopy("page.dashboard.value_card_3_text");
  const outcome1 = useCopy(OUTCOME_COPY_KEYS[0]);
  const outcome2 = useCopy(OUTCOME_COPY_KEYS[1]);
  const outcome3 = useCopy(OUTCOME_COPY_KEYS[2]);
  const outcome4 = useCopy(OUTCOME_COPY_KEYS[3]);
  const outcome5 = useCopy(OUTCOME_COPY_KEYS[4]);
  const outcomes = [outcome1, outcome2, outcome3, outcome4, outcome5];

  const valueCards = [
    { title: card1Title, text: card1Text, icon: VALUE_CARD_ICONS[0] },
    { title: card2Title, text: card2Text, icon: VALUE_CARD_ICONS[1] },
    { title: card3Title, text: card3Text, icon: VALUE_CARD_ICONS[2] },
  ];

  return (
    <section className={cn("space-y-7 md:space-y-9", className)}>
      <div className="pt-2 pb-2 md:pt-4 md:pb-3">
        <div className="mx-auto max-w-xl space-y-7">
          <div className="space-y-5">
            {showBadge && (
              <p className="inline-flex items-center rounded-full border border-border/70 bg-surface/40 px-3 py-1 text-xs font-medium tracking-wide text-muted">
                {badge}
              </p>
            )}

            <h1 className="text-3xl sm:text-[2.125rem] font-semibold tracking-tight leading-[1.18] text-foreground">
              {title}
            </h1>

            <div className="space-y-4">
              <p className="text-base sm:text-[1.0625rem] text-foreground/80 leading-[1.65]">
                {subtitle}
              </p>
              {showIntro && (
                <p className="text-sm sm:text-[0.9375rem] text-muted leading-[1.7]">
                  {intro}
                </p>
              )}
              <p className="text-sm sm:text-[0.9375rem] text-muted/90 leading-[1.7]">
                {audience}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <Link href={ctaHref} className="inline-block">
              <Button
                size="lg"
                className={cn(
                  "h-12 min-w-[15rem] rounded-xl px-8 text-[0.9375rem] font-medium",
                  "shadow-[0_8px_28px_-8px_rgba(59,130,246,0.45)]",
                  "hover:shadow-[0_12px_32px_-8px_rgba(59,130,246,0.55)]",
                  "transition-[box-shadow,background-color] duration-200"
                )}
              >
                {cta}
              </Button>
            </Link>
            {showCtaHint && (
              <p className="max-w-md text-xs sm:text-[0.8125rem] text-muted/80 leading-[1.65]">
                {ctaHint}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 sm:items-stretch">
        {valueCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className={cn(
                "flex h-full flex-col rounded-2xl border border-border/50 bg-surface/25 p-5 sm:p-6",
                "transition-colors duration-200 hover:border-border/70 hover:bg-surface/40"
              )}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-background/40 text-foreground/55">
                <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
              </div>
              <h2 className="text-[0.9375rem] font-semibold leading-snug text-foreground/95">
                {card.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted leading-[1.65]">{card.text}</p>
            </article>
          );
        })}
      </div>

      {showOutcomes && (
        <div
          className={cn(
            "rounded-2xl border border-border/50 bg-surface/20 p-6 sm:p-8",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
          )}
        >
          <h2 className="text-base sm:text-[1.0625rem] font-semibold text-foreground/95">
            {outcomesTitle}
          </h2>
          <ul className="mt-5 space-y-3.5">
            {outcomes.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm sm:text-[0.9375rem] text-foreground/80"
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface/50"
                  aria-hidden
                >
                  <Check className="h-3 w-3 text-foreground/45" />
                </span>
                <span className="leading-[1.65]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
