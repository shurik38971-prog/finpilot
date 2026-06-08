"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ESCAPE_CONFIDENCE_LABELS,
  formatEscapeIncomeRange,
  type EscapePlanConfidence,
  type EscapePlanDifficulty,
  type EscapePlanOption,
} from "@/types/escape-plan";
import { Check, Loader2 } from "lucide-react";

function difficultyLabel(difficulty: EscapePlanDifficulty): string {
  switch (difficulty) {
    case "low":
      return "Низкая";
    case "high":
      return "Высокая";
    default:
      return "Средняя";
  }
}

function difficultyVariant(
  difficulty: EscapePlanDifficulty
): "success" | "warning" | "danger" {
  switch (difficulty) {
    case "low":
      return "success";
    case "high":
      return "danger";
    default:
      return "warning";
  }
}

function confidenceVariant(
  confidence: EscapePlanConfidence
): "success" | "warning" | "danger" {
  switch (confidence) {
    case "high":
      return "success";
    case "low":
      return "danger";
    default:
      return "warning";
  }
}

function resolveWhyChosen(option: EscapePlanOption): string[] {
  if (option.why_chosen?.length) return option.why_chosen;
  if (option.why_fits) return [option.why_fits];
  return [];
}

interface EscapePlanOptionCardProps {
  option: EscapePlanOption;
  isActive: boolean;
  choosing: boolean;
  onChoose: (option: EscapePlanOption) => void;
}

export function EscapePlanOptionCard({
  option,
  isActive,
  choosing,
  onChoose,
}: EscapePlanOptionCardProps) {
  const confidence = option.confidence ?? "medium";
  const incomeRange = formatEscapeIncomeRange(option);
  const whyChosen = resolveWhyChosen(option);

  return (
    <Card className={isActive ? "ring-1 ring-accent/50" : undefined}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{option.title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant={confidenceVariant(confidence)}>
              Уверенность: {ESCAPE_CONFIDENCE_LABELS[confidence]}
            </Badge>
            <Badge variant={difficultyVariant(option.difficulty)}>
              Сложность: {difficultyLabel(option.difficulty)}
            </Badge>
          </div>
        </div>

        {option.why_fits && <CardDescription>{option.why_fits}</CardDescription>}

        {whyChosen.length > 0 && (
          <div className="text-sm">
            <p className="text-muted mb-2">Почему этот вариант подходит:</p>
            <ul className="space-y-1">
              {whyChosen.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <Check className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-muted">Первый шаг</dt>
            <dd>{option.first_step || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Потенциал</dt>
            <dd className="font-medium">
              {incomeRange ?? "зависит от исполнения и рынка"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Время</dt>
            <dd>{option.time_required || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Риск</dt>
            <dd>{option.risk || "—"}</dd>
          </div>
        </dl>

        {isActive ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <Check className="size-4" />
            Активное направление
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={choosing}
            onClick={() => onChoose(option)}
            className="w-fit"
          >
            {choosing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Сохраняем…
              </>
            ) : (
              "Хочу попробовать"
            )}
          </Button>
        )}
      </CardHeader>
    </Card>
  );
}
