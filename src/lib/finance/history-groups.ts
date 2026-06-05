import {
  endOfWeek,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import type { AnalysisRecord } from "@/types/analysis";

export interface HistoryGroup {
  label: string;
  items: AnalysisRecord[];
}

function getAnalysisDay(record: AnalysisRecord): Date {
  const day = record.analysis_date ?? record.created_at.split("T")[0];
  return startOfDay(new Date(day));
}

export function dedupeAnalysesByDay(
  analyses: AnalysisRecord[]
): AnalysisRecord[] {
  const byDay = new Map<string, AnalysisRecord>();

  for (const item of analyses) {
    const dayKey = item.analysis_date ?? item.created_at.split("T")[0];
    const existing = byDay.get(dayKey);
    if (!existing || new Date(item.created_at) > new Date(existing.created_at)) {
      byDay.set(dayKey, { ...item, analysis_date: dayKey });
    }
  }

  return Array.from(byDay.values()).sort((a, b) => {
    const dayA = a.analysis_date ?? a.created_at.split("T")[0];
    const dayB = b.analysis_date ?? b.created_at.split("T")[0];
    return dayB.localeCompare(dayA);
  });
}

export function groupAnalysesByPeriod(
  analyses: AnalysisRecord[]
): HistoryGroup[] {
  const deduped = dedupeAnalysesByDay(analyses);
  const now = startOfDay(new Date());
  const yesterday = subDays(now, 1);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const today: AnalysisRecord[] = [];
  const yesterdayItems: AnalysisRecord[] = [];
  const thisWeek: AnalysisRecord[] = [];
  const earlier: AnalysisRecord[] = [];

  for (const item of deduped) {
    const day = getAnalysisDay(item);

    if (isSameDay(day, now)) {
      today.push(item);
    } else if (isSameDay(day, yesterday)) {
      yesterdayItems.push(item);
    } else if (isWithinInterval(day, { start: weekStart, end: weekEnd })) {
      thisWeek.push(item);
    } else {
      earlier.push(item);
    }
  }

  const groups: HistoryGroup[] = [];
  if (today.length) groups.push({ label: "Сегодня", items: today });
  if (yesterdayItems.length)
    groups.push({ label: "Вчера", items: yesterdayItems });
  if (thisWeek.length)
    groups.push({ label: "На этой неделе", items: thisWeek });
  if (earlier.length) groups.push({ label: "Ранее", items: earlier });

  return groups;
}
