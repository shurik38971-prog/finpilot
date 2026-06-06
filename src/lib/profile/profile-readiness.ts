export interface ProfileReadinessStep {
  id: "income" | "expenses" | "goal" | "analysis";
  label: string;
  done: boolean;
  href: string;
}

export interface ProfileReadiness {
  percent: number;
  steps: ProfileReadinessStep[];
  complete: boolean;
}

export function computeProfileReadiness(input: {
  hasIncome: boolean;
  hasExpenses: boolean;
  hasGoal: boolean;
  hasAnalysis: boolean;
}): ProfileReadiness {
  const steps: ProfileReadinessStep[] = [
    {
      id: "income",
      label: "Доходы",
      done: input.hasIncome,
      href: "/income",
    },
    {
      id: "expenses",
      label: "Расходы",
      done: input.hasExpenses,
      href: "/expenses",
    },
    {
      id: "goal",
      label: "Цель",
      done: input.hasGoal,
      href: "/goals",
    },
    {
      id: "analysis",
      label: input.hasAnalysis ? "Первый анализ" : "Выполнить первый анализ",
      done: input.hasAnalysis,
      href: "/analyze",
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const percent = doneCount * 25;

  return {
    percent,
    steps,
    complete: percent === 100,
  };
}
