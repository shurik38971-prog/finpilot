"use client";

import { FinancialProfileSettings } from "@/components/settings/financial-profile-settings";
import { IncomeExpectationsSettings } from "@/components/settings/income-expectations-settings";
import { PageHeader } from "@/components/layout/page-header";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import type { ProfileType } from "@/types/profile";
import { fullAccountReset } from "@/lib/actions/data-management";
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
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FULL_RESET_CONFIRM_TEXT = "удалить";

export function SettingsPageClient({
  profileType,
  profileIncome,
}: {
  profileType: ProfileType;
  profileIncome: ProfileIncomeParameters;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fullResetConfirmed =
    confirmText.trim().toLowerCase() === FULL_RESET_CONFIRM_TEXT;

  function closeModal() {
    if (loading) return;
    setModalOpen(false);
    setConfirmText("");
    setError("");
  }

  async function handleFullReset() {
    setLoading(true);
    setError("");
    try {
      await fullAccountReset();
      setModalOpen(false);
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Удалить все данные</CardTitle>
          <CardDescription>
            Безвозвратно удаляет доходы, расходы, долги, цели, анализы, задачи и
            настройки. Аккаунт станет полностью чистым.
          </CardDescription>
        </CardHeader>

        <div className="px-5 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-danger/30 bg-danger/5 p-4">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-400" />
                Удалить все данные
              </p>
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                Это действие нельзя отменить. После удаления откроется мастер
                настройки с нуля.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              className="shrink-0 min-h-[44px] w-full sm:w-auto"
              onClick={() => {
                setError("");
                setConfirmText("");
                setModalOpen(true);
              }}
            >
              Удалить все данные
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={closeModal} title="Удалить все данные?">
        <div className="space-y-4">
          <p className="text-sm text-foreground/85 leading-relaxed">
            Будут безвозвратно удалены все доходы, расходы, долги, цели,
            анализы, задачи, оценки рекомендаций и обратная связь.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Чтобы подтвердить, введите{" "}
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
              onClick={() => void handleFullReset()}
              disabled={loading || !fullResetConfirmed}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить все данные"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
