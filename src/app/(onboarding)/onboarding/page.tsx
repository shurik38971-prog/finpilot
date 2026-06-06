import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getOnboardingProgress } from "@/lib/actions/onboarding";
import { getUserFinancialProfile } from "@/lib/actions/profile";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const [progress, profile] = await Promise.all([
    getOnboardingProgress(),
    getUserFinancialProfile(),
  ]);

  if (progress?.completed) {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizard
      progress={progress}
      initialProfileType={profile.profileType}
    />
  );
}
