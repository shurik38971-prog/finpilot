import { Card, CardDescription } from "@/components/ui/card";
import { Info } from "lucide-react";

export function AnalysisDisclaimer() {
  return (
    <Card className="border-border/80 bg-surface/40">
      <CardDescription className="flex gap-3 px-5 py-4 text-sm leading-relaxed">
        <Info className="h-4 w-4 shrink-0 text-muted mt-0.5" />
        <span>
          Рекомендации ФинПилот не являются финансовой консультацией. Используйте
          их как ориентир для самостоятельного принятия решений.
        </span>
      </CardDescription>
    </Card>
  );
}
