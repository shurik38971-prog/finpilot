"use client";

import { deleteAnalysis } from "@/lib/actions/analyses";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { buildFallbackComparison } from "@/lib/finance/analysis-comparison";
import { groupAnalysesByPeriod } from "@/lib/finance/history-groups";
import { formatHistoryDate } from "@/lib/utils";
import type { AnalysisComparison, AnalysisRecord } from "@/types/analysis";
import {
  ArrowDown,
  ArrowUp,
  History,
  Loader2,
  Minus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function buildComparison(analyses: AnalysisRecord[]): AnalysisComparison | null {
  if (analyses.length < 2) return null;

  const current = analyses[0];
  const previous = analyses[1];
  const indexDelta =
    current.index_delta ??
    (current.financial_index !== null && previous.financial_index !== null
      ? current.financial_index - previous.financial_index
      : null);

  const comment =
    current.comparison_comment ??
    buildFallbackComparison(current, previous, indexDelta);

  return { current, previous, indexDelta, comment };
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;

  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-muted">
        <Minus className="h-4 w-4" />
        без изменений
      </span>
    );
  }

  const isUp = delta > 0;

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        isUp ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {isUp ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      {isUp ? "+" : ""}
      {delta} пунктов
    </span>
  );
}

function HistoryTable({
  items,
  showDelta,
  onDelete,
  deletingId,
  onOpenDetail,
}: {
  items: AnalysisRecord[];
  showDelta: boolean;
  onDelete: (id: string) => void;
  deletingId: string | null;
  onOpenDetail: (row: AnalysisRecord) => void;
}) {
  return (
    <table className="w-full text-sm min-w-[720px]">
      <thead>
        <tr className="border-b border-border text-muted">
          <th className="px-4 py-3 text-left font-medium">Дата</th>
          <th className="px-4 py-3 text-left font-medium">Индекс</th>
          {showDelta && (
            <th className="px-4 py-3 text-left font-medium">Δ</th>
          )}
          <th className="px-4 py-3 text-left font-medium">Главная проблема</th>
          <th className="px-4 py-3 text-left font-medium">Следующий шаг</th>
          <th className="px-4 py-3 text-right font-medium w-12" />
        </tr>
      </thead>
      <tbody>
        {items.map((row, i) => (
          <tr
            key={row.id}
            className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors"
          >
            <td className="px-4 py-3 whitespace-nowrap">
              {formatHistoryDate(row.analysis_date ?? row.created_at)}
            </td>
            <td className="px-4 py-3 font-semibold">
              {row.financial_index ?? "—"}
            </td>
            {showDelta && (
              <td className="px-4 py-3">
                {i === 0 && row.index_delta !== null ? (
                  <Badge
                    variant={
                      row.index_delta > 0
                        ? "success"
                        : row.index_delta < 0
                          ? "danger"
                          : "default"
                    }
                  >
                    {row.index_delta > 0 ? "+" : ""}
                    {row.index_delta}
                  </Badge>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            )}
            <td className="px-4 py-3">
              <button
                type="button"
                onClick={() => onOpenDetail(row)}
                className="text-left hover:text-accent transition-colors underline-offset-2 hover:underline"
              >
                {row.main_problem_short ?? row.main_problem}
              </button>
            </td>
            <td className="px-4 py-3 text-muted max-w-[220px]">
              {row.next_step ?? "—"}
            </td>
            <td className="px-4 py-3 text-right">
              <Button
                variant="ghost"
                size="sm"
                disabled={deletingId === row.id}
                onClick={() => onDelete(row.id)}
                aria-label="Удалить анализ"
              >
                {deletingId === row.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                )}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface HistoryPageClientProps {
  analyses: AnalysisRecord[];
}

export function HistoryPageClient({ analyses }: HistoryPageClientProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnalysisRecord | null>(null);

  const comparison = buildComparison(analyses);
  const groups = groupAnalysesByPeriod(analyses);

  async function handleDelete(id: string) {
    if (!confirm("Удалить этот анализ из истории?")) return;
    setDeletingId(id);
    try {
      await deleteAnalysis(id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="История анализов"
        description="Один анализ в день — сравнение с предыдущим днём"
      />

      {comparison && (
        <Card className="mb-6 border-accent/30">
          <CardHeader>
            <CardTitle className="text-base">
              Сравнение с предыдущим днём
            </CardTitle>
            <CardDescription>
              {formatHistoryDate(
                comparison.current.analysis_date ?? comparison.current.created_at
              )}{" "}
              vs{" "}
              {formatHistoryDate(
                comparison.previous.analysis_date ??
                  comparison.previous.created_at
              )}
            </CardDescription>
          </CardHeader>
          <div className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg bg-surface-hover/50 p-3">
                <p className="text-muted text-xs mb-1">Текущий индекс</p>
                <p className="text-2xl font-bold">
                  {comparison.current.financial_index ?? "—"}
                </p>
              </div>
              <div className="rounded-lg bg-surface-hover/50 p-3">
                <p className="text-muted text-xs mb-1">Предыдущий день</p>
                <p className="text-2xl font-bold">
                  {comparison.previous.financial_index ?? "—"}
                </p>
              </div>
              <div className="rounded-lg bg-surface-hover/50 p-3 flex flex-col justify-center">
                <p className="text-muted text-xs mb-1">Изменение</p>
                <DeltaBadge delta={comparison.indexDelta} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-hover/30 p-4">
              <p className="text-xs text-muted mb-2">
                {comparison.current.comparison_comment
                  ? "Комментарий ИИ"
                  : "Сравнение"}
              </p>
              <p className="text-sm leading-relaxed">{comparison.comment}</p>
            </div>
          </div>
        </Card>
      )}

      {analyses.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-16 text-center px-6">
            <div className="rounded-full bg-surface-hover p-4 mb-4">
              <History className="h-8 w-8 text-muted" />
            </div>
            <h3 className="text-lg font-medium mb-1">История пуста</h3>
            <p className="text-sm text-muted max-w-sm mb-4">
              Запустите ИИ-анализ — сохраняется один результат в день.
            </p>
            <Link href="/analyze" className="text-sm text-accent hover:underline">
              Перейти к ИИ-анализу →
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="text-sm font-medium text-muted mb-2 px-1">
                {group.label}
              </h3>
              <div className="glass overflow-x-auto">
                <HistoryTable
                  items={group.items}
                  showDelta={group.label === "Сегодня"}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                  onOpenDetail={setDetail}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.main_problem_short ?? "Подробности"}
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <p className="leading-relaxed">{detail.main_problem}</p>
            {detail.next_step && (
              <div className="rounded-lg bg-surface-hover/50 p-3">
                <p className="text-xs text-muted mb-1">Следующий шаг</p>
                <p>{detail.next_step}</p>
              </div>
            )}
            {detail.recommendations?.summary && (
              <div>
                <p className="text-xs text-muted mb-1">Диагностика</p>
                <p className="text-muted leading-relaxed">
                  {detail.recommendations.summary}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
