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
          Этот анализ уже использует данные, которые вы указали при регистрации.
          Точность прогноза пока ограничена, потому что истории операций ещё
          мало.
          <br />
          <br />
          Добавляйте новые доходы и расходы по мере их появления — обычно
          заметный рост точности появляется через 3–4 недели использования.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
