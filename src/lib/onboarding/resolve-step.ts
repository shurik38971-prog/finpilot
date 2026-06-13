import type { OnboardingProgress } from "@/types/onboarding";

type StepFlags = Pick<
  OnboardingProgress,
  | "profile_done"
  | "income_done"
  | "expenses_done"
  | "debts_done"
  | "goal_done"
>;

const STEP_FIELDS: (keyof StepFlags)[] = [
  "profile_done",
  "income_done",
  "expenses_done",
  "debts_done",
  "goal_done",
];

export function resolveOnboardingStep(progress: StepFlags | null): number {
  if (!progress?.profile_done) return 1;
  if (!progress.income_done) return 2;
  if (!progress.expenses_done) return 3;
  if (!progress.debts_done) return 4;
  if (!progress.goal_done) return 5;
  return 5;
}

/** Next wizard step after the user completes `justCompletedStep` (1–5). */
export function advanceOnboardingStep(
  progress: StepFlags | null,
  justCompletedStep: number
): number {
  const merged: StepFlags = {
    profile_done: progress?.profile_done ?? false,
    income_done: progress?.income_done ?? false,
    expenses_done: progress?.expenses_done ?? false,
    debts_done: progress?.debts_done ?? false,
    goal_done: progress?.goal_done ?? false,
  };

  if (justCompletedStep >= 1 && justCompletedStep <= STEP_FIELDS.length) {
    merged[STEP_FIELDS[justCompletedStep - 1]] = true;
  }

  return resolveOnboardingStep(merged);
}
