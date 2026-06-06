"use client";

import { GoalForm } from "@/components/forms/goal-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { deleteGoal } from "@/lib/actions/goals";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Debt } from "@/types/database";
import type { FinancialGoal } from "@/types/goals";
import { GOAL_TYPE_LABELS } from "@/types/goals";
import type { FinancialTaskWithGoal } from "@/types/tasks";
import { TASK_STATUS_LABELS } from "@/types/tasks";
import { CheckCircle2, Loader2, Plus, Target, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function GoalCard({
  goal,
  tasks,
  onEdit,
  onDelete,
  deleting,
}: {
  goal: FinancialGoal;
  tasks: FinancialTaskWithGoal[];
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const progress = Math.min(
    100,
    goal.target_amount > 0
      ? Math.round((goal.current_amount / goal.target_amount) * 100)
      : 0
  );
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);

  return (
    <Card className="cursor-pointer hover:border-accent/30 transition-colors" onClick={onEdit}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted mb-1">
              {GOAL_TYPE_LABELS[goal.type]}
            </p>
            <CardTitle className="text-base">{goal.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={deleting}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            )}
          </Button>
        </div>
        <CardDescription>
          {goal.type === "debt_payoff"
            ? `Осталось: ${formatCurrency(remaining)}`
            : `Прогресс: ${formatCurrency(goal.current_amount)} из ${formatCurrency(goal.target_amount)}`}
        </CardDescription>
      </CardHeader>
      <div className="px-5 pb-5">
        <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progress >= 100 ? "bg-emerald-400" : "bg-accent"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted">
          <span>{progress}%</span>
          {goal.deadline && <span>до {formatDate(goal.deadline)}</span>}
        </div>

        {tasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs text-muted mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Связанные задачи ({tasks.length})
            </p>
            <ul className="space-y-2">
              {tasks.slice(0, 4).map((task) => (
                <li key={task.id} className="text-sm">
                  <Link
                    href="/actions"
                    className="hover:text-accent transition-colors"
                  >
                    {task.title}
                  </Link>
                  <span className="text-xs text-muted ml-2">
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                </li>
              ))}
            </ul>
            {tasks.length > 4 && (
              <Link
                href="/actions"
                className="text-xs text-accent mt-2 inline-block"
              >
                Ещё {tasks.length - 4} на странице действий
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

interface GoalsPageClientProps {
  goals: FinancialGoal[];
  debts: Debt[];
  tasks: FinancialTaskWithGoal[];
}

export function GoalsPageClient({ goals, debts, tasks }: GoalsPageClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialGoal | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(goal: FinancialGoal) {
    setEditing(goal);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(undefined);
  }

  function handleSuccess() {
    closeModal();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить цель?")) return;
    setDeletingId(id);
    try {
      await deleteGoal(id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Ваши цели"
        description="Маршрут из точки А в точку Б — с конкретными суммами и прогрессом"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Новая цель
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Нет финансовых целей"
          description="Создайте цель, и FinPilot построит план достижения."
          actionLabel="Создать цель"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              tasks={tasks.filter((t) => t.goal_id === goal.id)}
              onEdit={() => openEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
              deleting={deletingId === goal.id}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Редактировать цель" : "Новая цель"}
      >
        <GoalForm
          goal={editing}
          debts={debts}
          onSuccess={handleSuccess}
        />
      </Modal>
    </div>
  );
}
