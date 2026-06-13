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
          До трёх ближайших шагов с пояснением, зачем они нужны
        </CardDescription>
      </CardHeader>

      {actions.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted leading-relaxed">
            Выберите направление в «Поиске выхода» — появятся конкретные шаги.
          </p>
          <Link href="/escape-plan">
            <Button size="sm">Поиск выхода</Button>
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
                <span className="text-foreground/80">Почему это важно: </span>
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
