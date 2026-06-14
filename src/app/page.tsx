import { SiteCopyProvider } from "@/components/copy/site-copy-provider";
import { FinPilotLandingSection } from "@/components/marketing/finpilot-landing-section";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { getResolvedSiteCopy } from "@/lib/copy/resolve-site-copy";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "FinPilot — Поймите, что происходит с вашими деньгами",
  description:
    "ФинПилот анализирует доходы, расходы, долги и обязательные платежи и даёт понятный план действий на 30 дней.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: onboarding } = await supabase
      .from("onboarding_progress")
      .select("completed")
      .eq("user_id", user.id)
      .maybeSingle();

    redirect(onboarding?.completed === false ? "/onboarding" : "/dashboard");
  }

  const siteCopy = await getResolvedSiteCopy();

  return (
    <SiteCopyProvider copy={siteCopy}>
      <PublicPageShell>
        <FinPilotLandingSection
          ctaHref="/signup"
          showCtaHint
          showOutcomes
        />
      </PublicPageShell>
    </SiteCopyProvider>
  );
}
