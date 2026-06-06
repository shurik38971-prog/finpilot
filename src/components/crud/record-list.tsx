"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { notifyFinancialDataChanged } from "@/lib/finance-events";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface RecordListProps<T extends { id: string }> {
  items: T[];
  columns: Column<T>[];
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel: string;
  emptyTone?: "default" | "positive";
  addLabel: string;
  formComponent: React.ComponentType<{
    item?: T;
    onSuccess: () => void;
  }>;
  onDelete: (id: string) => Promise<void>;
  formTitle: { create: string; edit: string };
}

export function RecordList<T extends { id: string }>({
  items,
  columns,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyTone = "default",
  addLabel,
  formComponent: FormComponent,
  onDelete,
  formTitle,
}: RecordListProps<T>) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | undefined>();

  function refreshAfterMutation() {
    router.refresh();
    notifyFinancialDataChanged();
  }

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(item: T) {
    setEditing(item);
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
    await onDelete(id);
    refreshAfterMutation();
  }

  return (
    <>
      {items.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={openCreate}
          tone={emptyTone}
        />
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-muted">
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-4 py-3 text-left font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium w-24">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key as string] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? formTitle.edit : formTitle.create}
      >
        <FormComponent item={editing} onSuccess={handleFormSuccess} />
      </Modal>
    </>
  );
}

export { Badge, formatCurrency, formatDate };
