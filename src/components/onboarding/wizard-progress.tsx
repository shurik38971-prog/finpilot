export function WizardProgress({
  step,
  total = 5,
}: {
  step: number;
  total?: number;
}) {
  const percent = Math.round((step / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Шаг {step} из {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
