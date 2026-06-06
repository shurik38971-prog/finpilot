export interface TaskComparable {
  title: string;
  description: string | null;
  impact_score: number;
}

export function descriptionSpecificity(description: string | null): number {
  return (description ?? "").trim().length;
}

export function isMoreSpecificTask(
  candidate: TaskComparable,
  existing: TaskComparable
): boolean {
  return (
    descriptionSpecificity(candidate.description) >
    descriptionSpecificity(existing.description)
  );
}

export function pickBetterTask<T extends TaskComparable>(
  a: T,
  b: T
): T {
  if (a.impact_score !== b.impact_score) {
    return a.impact_score > b.impact_score ? a : b;
  }

  return isMoreSpecificTask(a, b) ? a : b;
}
