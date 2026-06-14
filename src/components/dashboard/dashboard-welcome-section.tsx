"use client";

import { FinPilotLandingSection } from "@/components/marketing/finpilot-landing-section";

interface DashboardWelcomeSectionProps {
  ctaHref: string;
}

export function DashboardWelcomeSection({ ctaHref }: DashboardWelcomeSectionProps) {
  return (
    <FinPilotLandingSection
      ctaHref={ctaHref}
      ctaCopyKey="page.dashboard.hero_cta"
      className="mb-6 md:mb-8"
    />
  );
}
