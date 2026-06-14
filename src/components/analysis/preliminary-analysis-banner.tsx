import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

const PRELIMINARY_HINT =
  "Первичная оценка по Вашим ответам. Точность будет расти по мере добавления доходов, расходов, долгов и платежей.";

interface PreliminaryAnalysisBannerProps {
  compact?: boolean;
}

export function PreliminaryAnalysisBanner({
  compact = false,
}: PreliminaryAnalysisBannerProps) {
  if (compact) {
    return (
      <div className="flex max-h-12 items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-2">
        <Info className="h-3.5 w-3.5 shrink-0 text-sky-300" />
        <p className="text-xs leading-snug text-foreground/90 line-clamp-2">
          {PRELIMINARY_HINT}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-sky-500/30 bg-sky-500/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-sky-300">
          <Info className="h-4 w-4 shrink-0" />
          Предварительная оценка
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-foreground/90">
          {PRELIMINARY_HINT}
          <br />
          <br />
          Добавляйте доходы, расходы, долги и платежи по мере их появления —
          обычно заметный рост точности появляется через 3–4 недели
          использования.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
