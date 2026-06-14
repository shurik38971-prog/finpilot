"use client";

import { useCopy } from "@/components/copy/site-copy-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  /** Site copy key for the primary button label */
  ctaCopyKey?: string;
  showCtaHint?: boolean;
  showOutcomes?: boolean;
  showIntro?: boolean;
  className?: string;
}

export function FinPilotLandingSection({
  ctaHref,
  ctaCopyKey = "page.landing.cta",
  showCtaHint = false,
  showOutcomes = false,
  showIntro = false,
  className,
}: FinPilotLandingSectionProps) {
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
    <section className={cn("space-y-6 md:space-y-8", className)}>
      <div className="space-y-4">
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
          {showIntro && (
            <p className="text-sm text-muted leading-relaxed max-w-2xl">{intro}</p>
          )}
          <p className="text-sm text-muted leading-relaxed max-w-2xl">{audience}</p>
        </div>

        <div className="space-y-2">
          <Link href={ctaHref} className="inline-block">
            <Button size="lg">{cta}</Button>
          </Link>
          {showCtaHint && (
            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
              {ctaHint}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {valueCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="!p-4 border-border/60 bg-surface/40">
              <CardHeader className="!mb-2 !p-0 space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <CardTitle className="text-sm font-semibold leading-snug">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">
                  {card.text}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {showOutcomes && (
        <Card className="!p-5 border-border/60 bg-surface/30">
          <CardHeader className="!p-0 !mb-3">
            <CardTitle className="text-base font-semibold">{outcomesTitle}</CardTitle>
          </CardHeader>
          <ul className="space-y-2.5">
            {outcomes.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
                <Check
                  className="h-4 w-4 text-accent shrink-0 mt-0.5"
                  aria-hidden
                />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
