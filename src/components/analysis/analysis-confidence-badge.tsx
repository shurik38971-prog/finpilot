import { Badge } from "@/components/ui/badge";
import {
  CONFIDENCE_LABELS,
  type AnalysisConfidence,
} from "@/lib/finance/analysis-data-maturity";
import { cn } from "@/lib/utils";

const VARIANTS: Record<
  AnalysisConfidence,
  "danger" | "warning" | "success"
> = {
  low: "warning",
  medium: "warning",
  high: "success",
};

export function AnalysisConfidenceBadge({
  confidence,
  className,
}: {
  confidence: AnalysisConfidence;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted">Уверенность анализа</span>
      <Badge variant={VARIANTS[confidence]}>{CONFIDENCE_LABELS[confidence]}</Badge>
    </div>
  );
}
