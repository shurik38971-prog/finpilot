"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export interface EscapeRouteActivateModalProps {
  open: boolean;
  currentRouteTitle: string;
  newRouteTitle: string;
  error?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function EscapeRouteActivateModal({
  open,
  currentRouteTitle,
  newRouteTitle,
  error,
  loading = false,
  onClose,
  onConfirm,
}: EscapeRouteActivateModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Сделать этот маршрут активным?">
      <div className="space-y-4">
        <div className="text-sm text-foreground/85 leading-relaxed space-y-2">
          <p>Сейчас активен маршрут: «{currentRouteTitle}».</p>
          <p>Новый маршрут: «{newRouteTitle}».</p>
          <p>
            ФинПилот будет вести вас по шагам уже по новому маршруту. Старый
            маршрут сохранится в альтернативных/архивных маршрутах.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Переключение..." : "Сделать активным"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
