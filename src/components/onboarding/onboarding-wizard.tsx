"use client";

import { DebtsStep } from "@/components/onboarding/steps/debts-step";
import { ExpensesStep } from "@/components/onboarding/steps/expenses-step";
import { GoalStep } from "@/components/onboarding/steps/goal-step";
import { IncomeStep } from "@/components/onboarding/steps/income-step";
import { ProfileStep } from "@/components/onboarding/steps/profile-step";
import { WizardProgress } from "@/components/onboarding/wizard-progress";
import { Logo } from "@/components/brand/logo";
import { DEFAULT_PROFILE_TYPE, type ProfileType } from "@/types/profile";
import {
  advanceOnboardingStep,
  resolveOnboardingStep,
} from "@/lib/onboarding/resolve-step";
import type { OnboardingProgress } from "@/types/onboarding";
import { useMemo, useState } from "react";

export function OnboardingWizard({
  progress,
  initialProfileType,
}: {
  progress: OnboardingProgress | null;
  initialProfileType: ProfileType | null;
}) {
  const [step, setStep] = useState(() => resolveOnboardingStep(progress));
  const [profileType, setProfileType] = useState<ProfileType>(
    initialProfileType ?? DEFAULT_PROFILE_TYPE
  );

  const stepContent = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <ProfileStep
            onComplete={(type) => {
              setProfileType(type);
              setStep(advanceOnboardingStep(progress, 1));
            }}
          />
        );
      case 2:
        return (
          <IncomeStep
            profileType={profileType}
            onComplete={() => setStep(advanceOnboardingStep(progress, 2))}
          />
        );
      case 3:
        return (
          <ExpensesStep
            onComplete={() => setStep(advanceOnboardingStep(progress, 3))}
          />
        );
      case 4:
        return (
          <DebtsStep
            onComplete={() => setStep(advanceOnboardingStep(progress, 4))}
          />
        );
      case 5:
        return <GoalStep skipGoalCreation={progress?.goal_done ?? false} />;
      default:
        return null;
    }
  }, [step, profileType, progress]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="px-4 pt-6 pb-4 max-w-lg mx-auto w-full">
        <div className="flex justify-center mb-6">
          <Logo variant="stacked" iconSize={36} />
        </div>
        <WizardProgress step={step} />
      </header>

      <main className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        <div className="glass p-5 sm:p-6">{stepContent}</div>
      </main>
    </div>
  );
}
