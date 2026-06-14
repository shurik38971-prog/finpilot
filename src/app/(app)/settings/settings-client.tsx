"use client";

import { FinancialProfileSettings } from "@/components/settings/financial-profile-settings";
import { IncomeExpectationsSettings } from "@/components/settings/income-expectations-settings";
import { PageHeader } from "@/components/layout/page-header";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import type { ProfileType } from "@/types/profile";
import {
  clearAnalysisHistory,
  clearTasks,
  fullAccountReset,
  restartOnboardingSetup,
} from "@/lib/actions/data-management";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ModalAction =
  | "restart"
  | "full-step1"
  | "full-step2"
  | "analyses"
  | "tasks"
  | null;

const FULL_RESET_CONFIRM_TEXT = "УДАЛИТЬ ВСЁ";

export function SettingsPageClient({
  profileType,
  profileIncome,
}: {
  profileType: ProfileType;
  profileIncome: ProfileIncomeParameters;
}) {
  const router = useRouter();
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function closeModal() {
    if (loading) return;
    setModalAction(null);
    setConfirmText("");
    setError("");
  }

  async function handleRestartOnboarding() {
    setLoading(true);
    setError("");
    try {
      await restartOnboardingSetup();
      setModalAction(null);
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось перезапустить настройку"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFullReset() {
    setLoading(true);
    setError("");
    try {
      await fullAccountReset();
      setModalAction(null);
      setConfirmText("");
      setToastMessage("Все данные удалены");
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось удалить данные"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePartialClear(action: "analyses" | "tasks") {
    setLoading(true);
    setError("");
    try {
      if (action === "analyses") {
        await clearAnalysisHistory();
        setToastMessage("Сохранённые разборы удалены");
      } else {
        await clearTasks();
        setToastMessage("Задачи удалены");
      }
      setModalAction(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось удалить данные"
      );
    } finally {
      setLoading(false);
    }
  }

  async function confirmModalAction() {
    if (modalAction === "restart") {
      await handleRestartOnboarding();
      return;
    }
    if (modalAction === "full-step2") {
      await handleFullReset();
      return;
    }
    if (modalAction === "analyses" || modalAction === "tasks") {
      await handlePartialClear(modalAction);
    }
  }

  const fullResetConfirmed =
    confirmText.trim().toUpperCase() === FULL_RESET_CONFIRM_TEXT;

  return (
    <div>
      <PageHeader
        title="Настройки"
        description="Управление аккаунтом и данными FinPilot"
      />

      <FinancialProfileSettings currentProfileType={profileType} />

      <IncomeExpectationsSettings
        profileType={profileType}
        initialParams={profileIncome}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Тестирование</CardTitle>
          <CardDescription>
            Сброс данных для проверки онбординга и сценариев. Действия
            необратимы.
          </CardDescription>
        </CardHeader>

        <div className="space-y-4 px-5 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-surface-hover/30 p-4">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-accent" />
                Перезапустить настройку
              </p>
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                Сбрасывает профиль, онбординг, анализы, рекомендации и задачи.
                Доходы, расходы, долги и цели сохраняются. После сброса откроется
                мастер настройки.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 min-h-[44px] w-full sm:w-auto"
              onClick={() => {
                setError("");
                setModalAction("restart");
              }}
            >
              Перезапустить
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-danger/30 bg-danger/5 p-4">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-400" />
                Полный сброс данных
              </p>
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                Удаляет доходы, расходы, долги, цели, анализы, задачи и
                историю. Аккаунт станет полностью чистым.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              className="shrink-0 min-h-[44px] w-full sm:w-auto"
              onClick={() => {
                setError("");
                setConfirmText("");
                setModalAction("full-step1");
              }}
            >
              Сбросить всё
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Управление данными</CardTitle>
          <CardDescription>
            Точечная очистка отдельных разделов
          </CardDescription>
        </CardHeader>

        <div className="space-y-4 px-5 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-surface-hover/30 p-4">
            <div>
              <p className="text-sm font-medium">Очистить сохранённые разборы</p>
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                Удаляет прошлые результаты анализа и рекомендации. Доходы,
                расходы, долги и цели сохраняются.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              className="shrink-0 min-h-[44px] w-full sm:w-auto"
              onClick={() => {
                setError("");
                setModalAction("analyses");
              }}
            >
              Очистить
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-surface-hover/30 p-4">
            <div>
              <p className="text-sm font-medium">Очистить задачи</p>
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                Удаляет текущие шаги и задачи из раздела «Что делать».
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              className="shrink-0 min-h-[44px] w-full sm:w-auto"
              onClick={() => {
                setError("");
                setModalAction("tasks");
              }}
            >
              Очистить
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={modalAction === "restart"}
        onClose={closeModal}
        title="Перезапустить настройку?"
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/85 leading-relaxed">
            Будут сброшены финансовый профиль, статус онбординга, результаты
            анализа, рекомендации и задачи. Доходы, расходы, долги и цели
            останутся.
          </p>
          <p className="text-sm font-medium text-amber-400">
            После сброса вы перейдёте в мастер настройки с шага 1.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal} disabled={loading}>
              Отмена
            </Button>
            <Button onClick={confirmModalAction} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Сброс...
                </>
              ) : (
                "Перезапустить"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modalAction === "full-step1"}
        onClose={closeModal}
        title="Полный сброс данных?"
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/85 leading-relaxed">
            Будут безвозвратно удалены все доходы, расходы, долги, цели,
            анализы, задачи, оценки рекомендаций и обратная связь.
          </p>
          <p className="text-sm font-medium text-red-400">
            Это действие нельзя отменить.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setError("");
                setConfirmText("");
                setModalAction("full-step2");
              }}
            >
              Продолжить
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modalAction === "full-step2"}
        onClose={closeModal}
        title="Подтвердите полный сброс"
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/85 leading-relaxed">
            Чтобы удалить все данные, введите{" "}
            <span className="font-mono text-foreground">
              {FULL_RESET_CONFIRM_TEXT}
            </span>{" "}
            в поле ниже.
          </p>
          <Input
            id="full-reset-confirm"
            label="Подтверждение"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={FULL_RESET_CONFIRM_TEXT}
            autoComplete="off"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal} disabled={loading}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={confirmModalAction}
              disabled={loading || !fullResetConfirmed}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить всё"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modalAction === "analyses" || modalAction === "tasks"}
        onClose={closeModal}
        title={
          modalAction === "analyses"
            ? "Очистить сохранённые разборы?"
            : "Очистить задачи?"
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/85 leading-relaxed">
            {modalAction === "analyses"
              ? "Будут удалены прошлые результаты анализа и рекомендации. Доходы, расходы, долги и цели сохранятся."
              : "Будут удалены текущие шаги и задачи из раздела «Что делать»."}
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal} disabled={loading}>
              Отмена
            </Button>
            <Button variant="danger" onClick={confirmModalAction} disabled={loading}>
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

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
