import { SiteCopyProvider } from "@/components/copy/site-copy-provider";
import { FinPilotLandingSection } from "@/components/marketing/finpilot-landing-section";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { getResolvedSiteCopy } from "@/lib/copy/resolve-site-copy";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "ФинПилот — AI-помощник для личных финансов и нестабильного дохода",
  description:
    "ФинПилот анализирует доходы, расходы, долги и платежи, а затем помогает составить понятный план действий на 30 дней.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ФинПилот — разберите свою финансовую ситуацию",
    description:
      "Поймите, куда уходят деньги, что давит сильнее всего и какие шаги сделать в ближайшие 30 дней.",
    type: "website",
    url: "/",
    locale: "ru_RU",
    siteName: "ФинПилот",
  },
  twitter: {
    card: "summary_large_image",
    title: "ФинПилот — разберите свою финансовую ситуацию",
    description:
      "Поймите, куда уходят деньги, что давит сильнее всего и какие шаги сделать в ближайшие 30 дней.",
  },
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
          showIntro
        />
      </PublicPageShell>
    </SiteCopyProvider>
  );
}
