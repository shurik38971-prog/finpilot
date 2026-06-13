import { HintTooltip } from "@/components/ui/hint-tooltip";
import { HINTS } from "@/lib/copy/ui";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IncomeSummary {
  primaryIncome: number;
  additionalIncome: number;
  monthlyIncome: number;
}

interface SummaryCardsProps {
  totalIncome: number;
  incomeSummary?: IncomeSummary | null;
  totalExpenses: number;
  netCashFlow: number;
  totalDebt: number;
  debtPayments?: number;
  cleanupMode?: boolean;
}

const cards = [
  {
    key: "income",
    label: "Доход",
    icon: TrendingUp,
    color: "text-emerald-400",
    getValue: (p: SummaryCardsProps) => p.totalIncome,
  },
  {
    key: "expenses",
    label: "Расходы",
    icon: TrendingDown,
    color: "text-red-400",
    getValue: (p: SummaryCardsProps) => p.totalExpenses,
  },
  {
    key: "net",
    label: "Остаток",
    icon: Wallet,
    color: "text-accent",
    getValue: (p: SummaryCardsProps) => p.netCashFlow,
  },
  {
    key: "debt",
    label: "Долг",
    icon: CreditCard,
    color: "text-orange-400",
    getValue: (p: SummaryCardsProps) => p.totalDebt,
  },
] as const;

const cleanupCards = [
  {
    key: "income",
    label: "Доход",
    icon: TrendingUp,
    color: "text-emerald-400",
    getValue: (p: SummaryCardsProps) => p.totalIncome,
  },
  {
    key: "expenses",
    label: "Расходы",
    icon: TrendingDown,
    color: "text-red-400",
    getValue: (p: SummaryCardsProps) => p.totalExpenses,
  },
  {
    key: "debtPayments",
    label: "Платежи",
    icon: CreditCard,
    color: "text-orange-400",
    getValue: (p: SummaryCardsProps) => p.debtPayments ?? 0,
  },
  {
    key: "net",
    label: "Остаток",
    icon: Wallet,
    color: "text-accent",
    getValue: (p: SummaryCardsProps) => p.netCashFlow,
  },
] as const;

export function SummaryCards(props: SummaryCardsProps) {
  const income = props.incomeSummary;
  const visibleCards = props.cleanupMode ? cleanupCards : cards;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {visibleCards.map((card) => {
        const { key, label, icon: Icon, color, getValue } = card;
        const isDebt = key === "debt" || key === "debtPayments";

        return (
          <Card
            key={key}
            className={cn(
              "!p-3.5",
              isDebt && "border-orange-400/25 bg-orange-400/[0.04]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted flex items-center gap-1">
                  <span>{label}</span>
                  {key === "income" && (
                    <HintTooltip hint={HINTS.incomeMonth} />
                  )}
                  {key === "net" && <HintTooltip hint={HINTS.freeMoney} />}
                </p>

                <p
                  className={cn(
                    "font-bold mt-1 tabular-nums",
                    key === "income" || key === "expenses"
                      ? "text-xl sm:text-[1.35rem]"
                      : "text-lg",
                    key === "net" && getValue(props) < 0 && "text-red-400"
                  )}
                >
                  {formatCurrency(getValue(props))}
                </p>

                {key === "income" && income && income.primaryIncome > 0 && (
                  <p className="text-[11px] text-muted mt-0.5 leading-relaxed hidden sm:block">
                    {income.additionalIncome > 0
                      ? `${formatCurrency(income.primaryIncome)} + ${formatCurrency(income.additionalIncome)} доп.`
                      : "Основной доход из профиля"}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  "shrink-0 rounded-lg p-1.5",
                  isDebt
                    ? "bg-orange-400/15 ring-1 ring-orange-400/20"
                    : "bg-surface-hover/50"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    color,
                    isDebt && "h-[18px] w-[18px]"
                  )}
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
