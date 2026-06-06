import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export function PreliminaryAnalysisBanner() {
  return (
    <Card className="border-sky-500/30 bg-sky-500/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-sky-300">
          <Info className="h-4 w-4 shrink-0" />
          Предварительная оценка
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-foreground/90">
          Этот анализ построен на примерных данных, которые вы указали при
          регистрации. Точность прогноза пока ограничена.
          <br />
          <br />
          Чтобы получать более точные рекомендации, регулярно вносите доходы и
          расходы. Обычно точность заметно увеличивается через 3–4 недели
          использования.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
