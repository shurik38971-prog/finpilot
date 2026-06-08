import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";
import Link from "next/link";

export function EscapePlanLinkCard() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Compass className="h-4 w-4 text-accent" />
          Нужен другой выход?
        </CardTitle>
        <CardDescription>
          Подберём варианты по вашим навыкам и ограничениям — не общие советы про подработку
        </CardDescription>
        <Link
          href="/escape-plan"
          className={cn(
            "inline-flex w-full items-center justify-center rounded-lg border border-border",
            "bg-surface-hover px-4 py-2 text-sm font-medium text-foreground",
            "hover:bg-border transition-colors"
          )}
        >
          Найти варианты выхода
        </Link>
      </CardHeader>
    </Card>
  );
}
