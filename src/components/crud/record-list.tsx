"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { notifyFinancialDataChanged } from "@/lib/finance-events";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  emptyIcon: React.ComponentType<{ className?: string }>;
  emptyTitle: string;
  emptyDescription: string;
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
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
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
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="rounded-full bg-surface-hover p-4 mb-4">
            <EmptyIcon className="h-8 w-8 text-muted" />
          </div>
          <h3 className="text-lg font-medium mb-1">{emptyTitle}</h3>
          <p className="text-sm text-muted max-w-sm mb-4">{emptyDescription}</p>
          <Button onClick={openCreate}>{addLabel}</Button>
        </div>
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
