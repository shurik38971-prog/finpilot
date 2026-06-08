"use client";

import { DebtSummaryCard } from "@/components/debts/debt-summary-card";
import { DebtForm } from "@/components/forms/debt-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { deleteDebt } from "@/lib/actions/finance";
import { notifyFinancialDataChanged } from "@/lib/finance-events";
import type { Debt } from "@/types/database";
import { CreditCard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DebtsPageClient({ debts }: { debts: Debt[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | undefined>();

  function refreshAfterMutation() {
    router.refresh();
    notifyFinancialDataChanged();
  }

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(debt: Debt) {
    setEditing(debt);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(undefined);
  }

  function handleFormSuccess() {
    closeModal();
    refreshAfterMutation();
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить запись?")) return;
    await deleteDebt(id);
    refreshAfterMutation();
  }

  return (
    <div>
      <PageHeader
        title="Долги"
        description="Управление кредитами, займами и задолженностями"
      />

      {debts.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Добавить долг
          </Button>
        </div>
      )}

      {debts.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Долгов нет — это отлично"
          description="Если у вас есть кредиты, рассрочки или займы, добавьте их для более точного анализа."
          actionLabel="Добавить долг"
          onAction={openCreate}
          tone="positive"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {debts.map((debt) => (
            <DebtSummaryCard
              key={debt.id}
              debt={debt}
              onEdit={() => openEdit(debt)}
              onDelete={() => handleDelete(debt.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Редактировать долг" : "Новый долг"}
      >
        <DebtForm debt={editing} onSuccess={handleFormSuccess} />
      </Modal>
    </div>
  );
}
