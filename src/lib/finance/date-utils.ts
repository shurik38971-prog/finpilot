import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from "date-fns";

export function isDateInMonth(dateStr: string, month: Date): boolean {
  const date = parseISO(dateStr);
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  return isWithinInterval(date, { start, end });
}
