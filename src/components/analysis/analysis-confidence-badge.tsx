import {
  DATA_SOURCE_LABELS,
  type AnalysisDataSource,
} from "@/lib/finance/analysis-data-maturity";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function AnalysisDataSourceBadge({
  dataSource,
  className,
}: {
  dataSource: AnalysisDataSource;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm text-muted">Основано на данных:</p>
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>{DATA_SOURCE_LABELS[dataSource]}</span>
      </div>
    </div>
  );
}
