import { HintTooltip } from "@/components/ui/hint-tooltip";
import { COPY, HINTS } from "@/lib/copy/ui";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet, CreditCard } from "lucide-react";

interface SummaryCardsProps {
  totalIncome: number;
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
                  className={`text-xl font-bold mt-1 ${key === "net" && getValue(props) < 0 ? "text-red-400" : ""}`}
                >
                  {formatCurrency(getValue(props))}
                </p>
              </div>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted px-1">
        В карточках учитываются регулярные платежи и разовые операции текущего
        месяца.
      </p>
    </div>
  );
}
