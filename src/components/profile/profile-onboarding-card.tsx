"use client";

import { setUserProfileType } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROFILE_ONBOARDING_OPTIONS, type ProfileType } from "@/types/profile";
import { Loader2, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileOnboardingCard() {
  const router = useRouter();
  const [selected, setSelected] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      await setUserProfileType(selected);
      router.refresh();
    } catch {
      setError("Не удалось сохранить профиль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-accent/40 bg-accent/5 mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-accent" />
          Кто вы?
        </CardTitle>
        <CardDescription>
          Это поможет FinPilot точнее видеть вашу финансовую картину и подбирать
          варианты доп.дохода. Ответ можно изменить в настройках.
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
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button
          className="w-full sm:w-auto"
          disabled={!selected || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            "Продолжить"
          )}
        </Button>
      </div>
    </Card>
  );
}
