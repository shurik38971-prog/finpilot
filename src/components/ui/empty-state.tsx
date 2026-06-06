import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateRequirement {
  label: string;
  done: boolean;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  actionHref?: string;
  requirements?: EmptyStateRequirement[];
  tone?: "default" | "positive";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  requirements,
  tone = "default",
  className,
}: EmptyStateProps) {
  const isPositive = tone === "positive";

  return (
    <Card
      className={cn(
        "border-border/60 overflow-hidden",
        isPositive
          ? "bg-gradient-to-br from-emerald-500/5 via-transparent to-accent/5 border-emerald-500/15"
          : "bg-gradient-to-br from-accent/8 via-transparent to-transparent border-accent/15",
        className
      )}
    >
      <div className="flex flex-col items-center py-12 px-6 text-center">
        <div
          className={cn(
            "rounded-2xl p-4 mb-4 ring-1",
            isPositive
              ? "bg-emerald-500/10 ring-emerald-500/20"
              : "bg-accent/10 ring-accent/20"
          )}
        >
          <Icon
            className={cn(
              "h-8 w-8",
              isPositive ? "text-emerald-400" : "text-accent"
            )}
          />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted max-w-md leading-relaxed">
          {description}
        </p>

        {requirements && requirements.length > 0 && (
          <div className="mt-5 w-full max-w-xs text-left">
            <p className="text-xs uppercase tracking-wide text-muted mb-2">
              Нужно минимум:
            </p>
            <ul className="space-y-1.5">
              {requirements.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-sm"
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted shrink-0" />
                  )}
                  <span className={item.done ? "text-muted" : "text-foreground"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white"
            >
              {actionLabel}
            </Link>
          ) : (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
