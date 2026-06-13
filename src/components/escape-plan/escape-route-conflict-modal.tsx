"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export interface EscapeRouteConflictModalProps {
  open: boolean;
  currentRouteTitle: string;
  newRouteTitle: string;
  error?: string;
  loading?: boolean;
  showSaveAsAlternative?: boolean;
  onClose: () => void;
  onKeepCurrent: () => void;
  onMakeActive: () => void;
  onSaveAsAlternative?: () => void;
}

export function EscapeRouteConflictModal({
  open,
  currentRouteTitle,
  newRouteTitle,
  error,
  loading = false,
  showSaveAsAlternative = true,
  onClose,
  onKeepCurrent,
  onMakeActive,
  onSaveAsAlternative,
}: EscapeRouteConflictModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="У вас уже есть активный маршрут">
      <div className="space-y-4">
        <div className="text-sm text-foreground/85 leading-relaxed space-y-2">
          <p>
            Сейчас вы идёте по маршруту: «{currentRouteTitle}».
          </p>
          <p>Новый вариант: «{newRouteTitle}».</p>
          <p>
            Активным может быть только один маршрут, чтобы ФинПилот вёл вас по
            шагам без путаницы. Что сделать?
          </p>
        </div>

        {showSaveAsAlternative && (
          <p className="text-xs text-muted leading-relaxed">
            Если сделать новый маршрут активным, старый сохранится в архиве — его
            шаги не будут показываться в «Что делать».
          </p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            variant="secondary"
            onClick={onKeepCurrent}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Оставить текущий
          </Button>
          {showSaveAsAlternative && onSaveAsAlternative && (
            <Button
              variant="secondary"
              onClick={onSaveAsAlternative}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? "Сохранение..." : "Сохранить в альтернативы"}
            </Button>
          )}
          <Button
            onClick={onMakeActive}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Переключение..." : "Сделать новым активным"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
