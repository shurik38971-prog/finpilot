"use client";

import { GoalForm } from "@/components/forms/goal-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { deleteGoal } from "@/lib/actions/goals";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Debt } from "@/types/database";
import type { FinancialGoal } from "@/types/goals";
import { GOAL_TYPE_LABELS } from "@/types/goals";
import { Loader2, Plus, Target, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function GoalCard({
  goal,
  onEdit,
  onDelete,
  deleting,
}: {
  goal: FinancialGoal;
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
      </div>
    </Card>
  );
}

interface GoalsPageClientProps {
  goals: FinancialGoal[];
  debts: Debt[];
}

export function GoalsPageClient({ goals, debts }: GoalsPageClientProps) {
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
        title="Финансовые цели"
        description="Маршрут из точки А в точку Б — с конкретными суммами и прогрессом"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Новая цель
          </Button>
        }
      />

      {goals.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-16 text-center px-6">
            <div className="rounded-full bg-surface-hover p-4 mb-4">
              <Target className="h-8 w-8 text-muted" />
            </div>
            <h3 className="text-lg font-medium mb-1">Нет целей</h3>
            <p className="text-sm text-muted max-w-sm mb-4">
              Задайте подушку безопасности или цель по погашению долга — FinPilot
              покажет, сколько осталось до финиша.
            </p>
            <Button onClick={openCreate}>Создать первую цель</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
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
