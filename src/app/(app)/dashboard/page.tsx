import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { DashboardAutoRefresh } from "@/components/dashboard/dashboard-auto-refresh";
import { DemoDataBanner } from "@/components/dashboard/demo-data-banner";
import { FinancialIndexGauge } from "@/components/dashboard/financial-index-gauge";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { PageHeader } from "@/components/layout/page-header";
import { getFinancialData } from "@/lib/actions/finance";
import { computeDashboardSummary } from "@/lib/finance/index";
import { forecastCashFlow } from "@/lib/finance/forecast";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { incomes, expenses, debts } = await getFinancialData();

  const {
    totalIncome,
    totalExpenses,
    netCashFlow,
    totalDebt,
    financialIndex,
  } = computeDashboardSummary(incomes, expenses, debts);
  const forecast = forecastCashFlow(incomes, expenses, debts);
  const isEmpty =
    incomes.length === 0 && expenses.length === 0 && debts.length === 0;

  return (
    <DashboardAutoRefresh>
      <div>
        <PageHeader
          title="Дашборд"
          description="Обзор вашего финансового состояния"
        />

        <div className="space-y-6">
          <DemoDataBanner isEmpty={isEmpty} />
          <SummaryCards
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            netCashFlow={netCashFlow}
            totalDebt={totalDebt}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FinancialIndexGauge index={financialIndex} />
            <div className="lg:col-span-2">
              <CashFlowChart data={forecast} />
            </div>
          </div>
        </div>
      </div>
    </DashboardAutoRefresh>
  );
}
