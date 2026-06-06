"use client";

import { setUserProfileType } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { PROFILE_ONBOARDING_OPTIONS, type ProfileType } from "@/types/profile";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function ProfileStep({
  onComplete,
}: {
  onComplete: (profileType: ProfileType) => void;
}) {
  const [selected, setSelected] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      await setUserProfileType(selected);
      onComplete(selected);
    } catch {
      setError("Не удалось сохранить профиль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Выберите финансовый профиль</h2>
        <p className="text-sm text-muted mt-1">
          FinPilot подстроит вопросы и рекомендации под вашу ситуацию
        </p>
      </div>

      <div className="grid gap-2">
        {PROFILE_ONBOARDING_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSelected(option.value)}
            className={`rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${
              selected === option.value
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border/70 bg-surface-hover/40 text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        className="w-full h-12 text-base"
        disabled={!selected || loading}
        onClick={handleSubmit}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Сохранение...
          </>
        ) : (
          "Далее"
        )}
      </Button>
    </div>
  );
}
