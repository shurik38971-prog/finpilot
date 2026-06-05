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
    label: "Доход / мес (регуляр.)",
    icon: TrendingUp,
    color: "text-emerald-400",
    getValue: (p: SummaryCardsProps) => p.totalIncome,
  },
  {
    key: "expenses",
    label: "Расходы / мес (регуляр.)",
    icon: TrendingDown,
    color: "text-red-400",
    getValue: (p: SummaryCardsProps) => p.totalExpenses,
  },
  {
    key: "net",
    label: "Чистый поток",
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, color, getValue }) => (
        <Card key={key}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">{label}</p>
              <p className={`text-xl font-bold mt-1 ${key === "net" && getValue(props) < 0 ? "text-red-400" : ""}`}>
                {formatCurrency(getValue(props))}
              </p>
            </div>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
