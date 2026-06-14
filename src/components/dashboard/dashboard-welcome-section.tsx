"use client";

import { useCopy } from "@/components/copy/site-copy-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Compass, ListChecks, Search } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface DashboardWelcomeSectionProps {
  ctaHref: string;
}

const VALUE_CARD_ICONS: LucideIcon[] = [Search, ListChecks, Compass];

export function DashboardWelcomeSection({ ctaHref }: DashboardWelcomeSectionProps) {
  const title = useCopy("page.dashboard.title");
  const subtitle = useCopy("page.dashboard.hero_subtitle");
  const audience = useCopy("page.dashboard.hero_audience");
  const cta = useCopy("page.dashboard.hero_cta");
  const card1Title = useCopy("page.dashboard.value_card_1_title");
  const card1Text = useCopy("page.dashboard.value_card_1_text");
  const card2Title = useCopy("page.dashboard.value_card_2_title");
  const card2Text = useCopy("page.dashboard.value_card_2_text");
  const card3Title = useCopy("page.dashboard.value_card_3_title");
  const card3Text = useCopy("page.dashboard.value_card_3_text");

  const valueCards = [
    { title: card1Title, text: card1Text, icon: VALUE_CARD_ICONS[0] },
    { title: card2Title, text: card2Text, icon: VALUE_CARD_ICONS[1] },
    { title: card3Title, text: card3Text, icon: VALUE_CARD_ICONS[2] },
  ];

  return (
    <section className="mb-6 md:mb-8 space-y-5">
      <div className="space-y-4">
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
          <p className="text-sm text-muted leading-relaxed max-w-2xl">
            {audience}
          </p>
        </div>

        <Link href={ctaHref} className="inline-block">
          <Button size="lg">{cta}</Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {valueCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={cn(
                "!p-4 border-border/60 bg-surface/40",
                index === 0 && "sm:col-span-1"
              )}
            >
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
    </section>
  );
}
