"use client";

import {
  adminCreateEntityRecord,
  adminDeleteEntityRecord,
  adminUpdateEntityRecord,
} from "@/lib/actions/admin-crud";
import type { AdminEntitySchema, AdminFieldSchema } from "@/lib/admin/entity-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function formatCellValue(
  field: AdminFieldSchema,
  value: unknown
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "boolean") return value ? "Да" : "Нет";
  if (field.type === "json") {
    return typeof value === "string" ? value : JSON.stringify(value);
  }
  if (field.key === "amount" || field.key.endsWith("_amount")) {
    const num = Number(value);
    if (!Number.isNaN(num)) return formatCurrency(num);
  }
  if (field.type === "date" && typeof value === "string") {
    return formatDate(value);
  }
  return String(value);
}

function toFormValue(field: AdminFieldSchema, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (field.type === "json") {
    return typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2);
  }
  if (field.type === "boolean") return value ? "true" : "false";
  return String(value);
}

interface AdminDataTableProps {
  entityKey: string;
  schema: AdminEntitySchema;
  userId: string;
  records: Record<string, unknown>[];
}

export function AdminDataTable({
  entityKey,
  schema,
  userId,
  records,
}: AdminDataTableProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tableFields = useMemo(
    () => schema.fields.filter((field) => !field.hideInTable).slice(0, 5),
    [schema.fields]
  );

  const idKey = schema.idKey ?? "id";

  function refresh() {
    router.refresh();
  }

  function openCreate() {
    setEditing(null);
    setError("");
    setOpen(true);
  }

  function openEdit(record: Record<string, unknown>) {
    setEditing(record);
    setError("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};

    for (const field of schema.fields) {
      if (field.createOnly && editing) continue;
      const raw = formData.get(field.key);
      if (field.type === "boolean") {
        payload[field.key] = raw === "true";
      } else if (raw !== null) {
        payload[field.key] = raw;
      }
    }

    try {
      if (editing) {
        const recordId = String(editing[idKey] ?? userId);
        await adminUpdateEntityRecord(entityKey, userId, recordId, payload);
      } else {
        await adminCreateEntityRecord(entityKey, userId, payload);
      }
      closeModal();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(record: Record<string, unknown>) {
    if (!confirm(`Удалить ${schema.label.toLowerCase()}?`)) return;
    setLoading(true);
    try {
      await adminDeleteEntityRecord(
        entityKey,
        userId,
        String(record[idKey])
      );
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка удаления");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{schema.labelPlural}</h3>
        {!schema.readonly && (
          <Button size="sm" onClick={openCreate} disabled={loading}>
            <Plus className="size-4" />
            Добавить
          </Button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted border border-dashed border-border rounded-lg p-4">
          Записей нет.{" "}
          {!schema.readonly && (
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={openCreate}
            >
              Создать
            </button>
          )}
        </p>
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-muted">
                {tableFields.map((field) => (
                  <th key={field.key} className="px-3 py-2 text-left font-medium">
                    {field.label}
                  </th>
                ))}
                {!schema.readonly && (
                  <th className="px-3 py-2 text-right font-medium w-24">
                    Действия
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={String(record[idKey])}
                  className="border-b border-border/50 hover:bg-surface-hover/40"
                >
                  {tableFields.map((field) => (
                    <td key={field.key} className="px-3 py-2 align-top">
                      {formatCellValue(field, record[field.key])}
                    </td>
                  ))}
                  {!schema.readonly && (
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(record)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        {!schema.singleton && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record)}
                          >
                            <Trash2 className="size-3.5 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? `Редактировать: ${schema.label}` : `Новый: ${schema.label}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {schema.fields.map((field) => {
            if (field.createOnly && editing) return null;
            const value = editing ? toFormValue(field, editing[field.key]) : "";

            if (field.type === "select") {
              return (
                <Select
                  key={field.key}
                  name={field.key}
                  label={field.label}
                  defaultValue={value}
                  options={
                    field.options?.map((option) => ({
                      value: option.value,
                      label: option.label,
                    })) ?? []
                  }
                />
              );
            }

            if (field.type === "boolean") {
              return (
                <Select
                  key={field.key}
                  name={field.key}
                  label={field.label}
                  defaultValue={value || "false"}
                  options={[
                    { value: "true", label: "Да" },
                    { value: "false", label: "Нет" },
                  ]}
                />
              );
            }

            if (field.type === "textarea" || field.type === "json") {
              return (
                <label key={field.key} className="block space-y-1.5 text-sm">
                  <span className="text-muted">{field.label}</span>
                  <textarea
                    name={field.key}
                    defaultValue={value}
                    rows={field.type === "json" ? 8 : 4}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs"
                    required={field.required}
                  />
                </label>
              );
            }

            return (
              <Input
                key={field.key}
                name={field.key}
                label={field.label}
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                defaultValue={value}
                required={field.required}
                step={field.type === "number" ? "any" : undefined}
              />
            );
          })}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Сохранить"}
            </Button>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Отмена
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
