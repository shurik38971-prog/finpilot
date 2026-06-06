"use client";

import { PageHeader } from "@/components/layout/page-header";
import {
  clearAllUserData,
  clearAnalysisHistory,
  clearTasks,
} from "@/lib/actions/data-management";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ClearAction = "analyses" | "tasks" | "all";

const ACTION_COPY: Record<
  ClearAction,
  { title: string; description: string; success: string }
> = {
  analyses: {
    title: "Очистить историю анализов?",
    description: "Будут удалены все записи из истории ИИ-анализов.",
    success: "История анализов удалена",
  },
  tasks: {
    title: "Очистить задачи?",
    description: "Будут удалены все задачи из раздела «Что делать».",
    success: "Задачи удалены",
  },
  all: {
    title: "Очистить все мои данные?",
    description:
      "Будут удалены анализы, задачи, цели и обратная связь. Доходы, расходы и долги останутся.",
    success: "Данные удалены",
  },
};

export function SettingsPageClient() {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ClearAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function confirmAction() {
    if (!pendingAction) return;

    setLoading(true);
    setError("");

    try {
      if (pendingAction === "analyses") {
        await clearAnalysisHistory();
      } else if (pendingAction === "tasks") {
        await clearTasks();
      } else {
        await clearAllUserData();
      }

      setToastMessage(ACTION_COPY[pendingAction].success);
      setPendingAction(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось удалить данные"
      );
    } finally {
      setLoading(false);
    }
  }

  function openConfirm(action: ClearAction) {
    setError("");
    setPendingAction(action);
  }

  return (
    <div>
      <PageHeader
        title="Настройки"
        description="Управление аккаунтом и данными FinPilot"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Управление данными</CardTitle>
          <CardDescription>
            Удаляйте только свои данные. Действия необратимы и не затрагивают
            доходы, расходы и долги, если вы не выбираете полную очистку
            перечисленных ниже категорий.
          </CardDescription>
        </CardHeader>

        <div className="space-y-3 px-5 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-surface-hover/30 p-4">
            <div>
              <p className="text-sm font-medium">Очистить историю анализов</p>
              <p className="text-sm text-muted mt-1">
                Удаляет все записи из истории ИИ-анализов.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              className="shrink-0"
              onClick={() => openConfirm("analyses")}
            >
              Очистить
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-surface-hover/30 p-4">
            <div>
              <p className="text-sm font-medium">Очистить задачи</p>
              <p className="text-sm text-muted mt-1">
                Удаляет все задачи из раздела «Что делать».
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              className="shrink-0"
              onClick={() => openConfirm("tasks")}
            >
              Очистить
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-danger/30 bg-danger/5 p-4">
            <div>
              <p className="text-sm font-medium">Очистить все мои данные</p>
              <p className="text-sm text-muted mt-1">
                Удаляет анализы, задачи, цели и обратную связь.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              className="shrink-0"
              onClick={() => openConfirm("all")}
            >
              Очистить всё
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={pendingAction !== null}
        onClose={() => {
          if (!loading) setPendingAction(null);
        }}
        title={pendingAction ? ACTION_COPY[pendingAction].title : ""}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            {pendingAction ? ACTION_COPY[pendingAction].description : ""}
          </p>
          <p className="text-sm font-medium text-red-400">
            Это действие нельзя отменить.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setPendingAction(null)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button variant="danger" onClick={confirmAction} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Toast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />
    </div>
  );
}
