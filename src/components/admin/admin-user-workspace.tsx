"use client";

import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  adminClearUserAnalyses,
  adminRestartOnboarding,
} from "@/lib/actions/admin-crud";
import { adminDeleteUser, type AdminUserDetail } from "@/lib/actions/admin-users";
import { ADMIN_ENTITY_SCHEMAS } from "@/lib/admin/entity-schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const TAB_GROUPS: {
  id: string;
  label: string;
  entities: string[];
}[] = [
  {
    id: "profile",
    label: "Профиль",
    entities: ["user_profiles", "onboarding_progress", "user_capabilities"],
  },
  {
    id: "finance",
    label: "Финансы",
    entities: ["incomes", "expenses", "debts"],
  },
  {
    id: "goals",
    label: "Цели и задачи",
    entities: ["financial_goals", "financial_tasks"],
  },
  {
    id: "escape",
    label: "Выход",
    entities: ["user_escape_plans"],
  },
  {
    id: "analyses",
    label: "Анализы",
    entities: ["analyses"],
  },
  {
    id: "feedback",
    label: "Отзывы",
    entities: ["feedback", "feedback_messages", "user_feedback"],
  },
];

function formatAdminDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU");
}

interface AdminUserWorkspaceProps {
  user: AdminUserDetail;
  entityData: Record<string, Record<string, unknown>[]>;
}

export function AdminUserWorkspace({
  user,
  entityData,
}: AdminUserWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TAB_GROUPS[0].id);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState("");

  const activeGroup =
    TAB_GROUPS.find((group) => group.id === activeTab) ?? TAB_GROUPS[0];

  function runAction(action: () => Promise<void>, confirmText: string) {
    if (!confirm(confirmText)) return;
    setActionError("");
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/users" className="text-sm text-muted hover:text-accent">
            ← Все пользователи
          </Link>
          <h1 className="text-2xl font-bold mt-2">{user.email ?? "Без email"}</h1>
          <p className="text-sm text-muted mt-1 font-mono">{user.id}</p>
          <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted">
            <span>Регистрация: {formatAdminDate(user.created_at)}</span>
            <span>·</span>
            <span>Вход: {formatAdminDate(user.last_sign_in_at)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              runAction(
                () => adminRestartOnboarding(user.id),
                "Сбросить онбординг пользователя?"
              )
            }
          >
            Сбросить онбординг
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              runAction(
                () => adminClearUserAnalyses(user.id),
                "Удалить анализы и задачи пользователя?"
              )
            }
          >
            Очистить анализы
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400"
            disabled={pending}
            onClick={() =>
              runAction(async () => {
                await adminDeleteUser(user.id);
                router.push("/admin/users");
              }, "Удалить пользователя полностью? Это необратимо.")
            }
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="size-4" />
                Удалить аккаунт
              </>
            )}
          </Button>
        </div>
      </div>

      {actionError && <p className="text-sm text-red-400">{actionError}</p>}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(user.counts).map(([key, value]) => (
          <Card key={key}>
            <CardHeader className="p-4">
              <CardTitle className="text-xs text-muted font-normal">{key}</CardTitle>
              <p className="text-xl font-bold">{value}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TAB_GROUPS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              activeTab === tab.id
                ? "bg-accent/15 text-accent"
                : "text-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {activeGroup.entities.map((entityKey) => {
          const schema = ADMIN_ENTITY_SCHEMAS.find(
            (item) => item.key === entityKey
          );
          if (!schema) return null;

          const records = entityData[entityKey] ?? [];

          return (
            <section key={entityKey}>
              {records.length > 0 && (
                <Badge variant="default" className="mb-2">
                  {records.length}
                </Badge>
              )}
              <AdminDataTable
                entityKey={entityKey}
                schema={schema}
                userId={user.id}
                records={records}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
