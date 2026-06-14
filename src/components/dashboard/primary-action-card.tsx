import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatHistoryDate } from "@/lib/utils";
import type { FinancialTask } from "@/types/tasks";
import { CheckCircle2, Target } from "lucide-react";
import Link from "next/link";

function impactVariant(score: number): "danger" | "warning" | "success" | "default" {
  if (score >= 70) return "danger";
  if (score >= 45) return "warning";
  return "default";
}

interface PrimaryActionCardProps {
  task: FinancialTask | null;
}

export function PrimaryActionCard({ task }: PrimaryActionCardProps) {
  if (!task) {
    return (
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />
            Главное действие сейчас
          </CardTitle>
          <CardDescription>
            Запустите ИИ-анализ, чтобы ФинПилот предложил конкретные действия.
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-5">
          <Link href="/actions">
            <Button variant="secondary" size="sm">
              Перейти к действиям
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Главное действие сейчас
          </CardTitle>
          <Badge variant={impactVariant(task.impact_score)}>
            {task.impact_label ?? `${task.impact_score} баллов`}
          </Badge>
        </div>
        <CardDescription className="text-foreground font-medium">
          {task.title}
        </CardDescription>
      </CardHeader>
      <div className="px-5 pb-5 space-y-3">
        {task.description && (
          <p className="text-sm text-muted leading-relaxed">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>Эффект: {task.impact_score}/100</span>
          {task.due_date && (
            <span>до {formatHistoryDate(task.due_date)}</span>
          )}
        </div>
        <Link href="/actions">
          <Button size="sm">Перейти к действиям</Button>
        </Link>
      </div>
    </Card>
  );
}
