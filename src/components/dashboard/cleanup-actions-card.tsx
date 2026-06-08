import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FinancialTaskWithGoal } from "@/types/tasks";
import Link from "next/link";

interface CleanupActionsCardProps {
  tasks: FinancialTaskWithGoal[];
}

export function CleanupActionsCard({ tasks }: CleanupActionsCardProps) {
  const actions = tasks.filter((task) => Boolean(task.explanation?.trim())).slice(0, 3);

  return (
    <Card className="!p-4">
      <CardHeader className="!p-0 mb-3">
        <CardTitle className="text-base">Что делать сейчас</CardTitle>
        <CardDescription className="text-xs">
          До трёх шагов с понятным основанием из ваших данных
        </CardDescription>
      </CardHeader>

      {actions.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted leading-relaxed">
            Пока нет действий с объяснением. Запустите ИИ-анализ — FinPilot
            предложит конкретные шаги.
          </p>
          <Link href="/analyze">
            <Button size="sm">ИИ-анализ</Button>
          </Link>
        </div>
      ) : (
        <ol className="space-y-4">
          {actions.map((task, index) => (
            <li key={task.id} className="space-y-1">
              <p className="text-sm font-medium leading-snug">
                {index + 1}. {task.title}
              </p>
              <p className="text-xs text-muted leading-relaxed">
                <span className="text-foreground/80">Почему: </span>
                {task.explanation}
              </p>
            </li>
          ))}
          <Link href="/actions" className="inline-block pt-1">
            <Button variant="secondary" size="sm">
              Все действия
            </Button>
          </Link>
        </ol>
      )}
    </Card>
  );
}
