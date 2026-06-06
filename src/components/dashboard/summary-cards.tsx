import { HintTooltip } from "@/components/ui/hint-tooltip";
import { COPY, HINTS } from "@/lib/copy/ui";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  totalIncome: number;
  expectedIncome: number;
  incomeComparison: string | null;
  totalExpenses: number;
  netCashFlow: number;
  totalDebt: number;
}

const cards = [
  {
    key: "income",
    label: "Доходы за месяц",
    icon: TrendingUp,
    color: "text-emerald-400",
    getValue: (p: SummaryCardsProps) => p.totalIncome,
  },
  {
    key: "expenses",
    label: "Расходы за месяц",
    icon: TrendingDown,
    color: "text-red-400",
    getValue: (p: SummaryCardsProps) => p.totalExpenses,
  },
  {
    key: "net",
    label: COPY.leftPerMonth,
    icon: Wallet,
    color: "text-accent",
    getValue: (p: SummaryCardsProps) => p.netCashFlow,
  },
  {
    key: "debt",
    label: "Общий долг",
    icon: CreditCard,
    color: "text-orange-400",
    getValue: (p: SummaryCardsProps) => p.totalDebt,
  },
] as const;

export function SummaryCards(props: SummaryCardsProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ key, label, icon: Icon, color, getValue }) => (
          <Card key={key}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted flex items-center gap-1">
                  {label}
                  {key === "net" && <HintTooltip hint={HINTS.freeMoney} />}
                </p>
                <p
                  className={cn(
                    "text-xl font-bold mt-1",
                    key === "net" && getValue(props) < 0 && "text-red-400"
                  )}
                >
                  {formatCurrency(getValue(props))}
                </p>
                {key === "income" && props.expectedIncome > 0 && (
                  <p className="text-xs text-muted mt-1">
                    Ожидалось: {formatCurrency(props.expectedIncome)}
                  </p>
                )}
                {key === "income" && props.incomeComparison && (
                  <p
                    className={cn(
                      "text-xs mt-1",
                      props.incomeComparison.includes("ниже")
                        ? "text-orange-400"
                        : "text-emerald-400"
                    )}
                  >
                    {props.incomeComparison}
                  </p>
                )}
              </div>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted px-1 leading-relaxed">
        Для самозанятых доход может быть нестабильным, поэтому FinPilot сравнивает
        фактические поступления с ожидаемым доходом и средним доходом за прошлые
        месяцы. В расходах учитываются регулярные платежи и разовые операции
        текущего месяца.
      </p>
    </div>
  );
}
