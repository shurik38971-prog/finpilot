"use client";

import { setUserProfileType } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import {
  PROFILE_ONBOARDING_OPTIONS,
  PROFILE_TYPE_LABELS,
  type ProfileType,
} from "@/types/profile";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function FinancialProfileSettings({
  currentProfileType,
}: {
  currentProfileType: ProfileType;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProfileType>(currentProfileType);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    try {
      await setUserProfileType(selected);
      setToastMessage("Финансовый профиль обновлён");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Финансовый профиль</CardTitle>
          <CardDescription>
            Сейчас: {PROFILE_TYPE_LABELS[currentProfileType]}. Изменение
            влияет на подсказки, приоритет задач и ИИ-анализ.
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-5 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {PROFILE_ONBOARDING_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelected(option.value)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  selected === option.value
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border/70 bg-surface-hover/40 text-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            onClick={handleSave}
            disabled={loading || selected === currentProfileType}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить профиль"
            )}
          </Button>
        </div>
      </Card>
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  );
}
