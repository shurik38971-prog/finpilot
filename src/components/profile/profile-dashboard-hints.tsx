import { getDashboardHints, getProfileTypeLabel } from "@/lib/profile/financial-profile";
import type { ProfileType } from "@/types/profile";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function ProfileDashboardHints({
  profileType,
}: {
  profileType: ProfileType;
}) {
  const hints = getDashboardHints(profileType);

  return (
    <Card className="border-border/70 bg-surface-hover/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          Подсказки для {getProfileTypeLabel(profileType)}
        </CardTitle>
        <CardDescription>
          FinPilot учитывает ваш профиль в расчётах и рекомендациях
        </CardDescription>
      </CardHeader>
      <ul className="px-5 pb-5 space-y-2 text-sm text-muted">
        {hints.map((hint) => (
          <li key={hint} className="flex gap-2">
            <span className="text-accent">•</span>
            <span className="capitalize">{hint}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
