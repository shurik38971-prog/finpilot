"use client";

import { RecordList, Badge, formatCurrency, formatDate } from "@/components/crud/record-list";
import { IncomeForm } from "@/components/forms/income-form";
import { PageHeader } from "@/components/layout/page-header";
import { deleteIncome } from "@/lib/actions/finance";
import type { Income } from "@/types/database";
import { Settings2, TrendingUp } from "lucide-react";
import Link from "next/link";

function IncomeFormWrapper({
  item,
  onSuccess,
}: {
  item?: Income;
  onSuccess: () => void;
}) {
  return <IncomeForm income={item} onSuccess={onSuccess} />;
}

export function IncomePageClient({
  incomes,
  showIncomeExpectationsHint,
}: {
  incomes: Income[];
  showIncomeExpectationsHint?: boolean;
}) {
  return (
    <div>
      <PageHeader
        title="Дополнительные доходы"
        description="Подработка, аренда, премии и другие поступления сверх основного дохода"
      />

      {showIncomeExpectationsHint && (
        <div className="mb-6 rounded-xl border border-border/60 bg-surface-hover/30 p-4 space-y-3">
          <p className="text-sm text-muted leading-relaxed">
            Основной доход для самозанятых настраивается в финансовом профиле.
            Здесь добавляйте только дополнительные источники.
          </p>
          <Link
            href="/settings#income-expectations"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border"
          >
            <Settings2 className="h-4 w-4" />
            Настроить основной доход
          </Link>
        </div>
      )}

      <RecordList
        items={incomes}
        columns={[
          { key: "title", label: "Название" },
          {
            key: "amount",
            label: "Сумма",
            render: (i) => formatCurrency(i.amount),
          },
          {
            key: "category",
            label: "Категория",
            render: (i) => <Badge>{i.category}</Badge>,
          },
          {
            key: "date",
            label: "Дата",
            render: (i) => formatDate(i.date),
          },
          {
            key: "period",
            label: "Период",
            render: (i) => (
              <Badge variant={i.is_recurring ? "success" : "warning"}>
                {i.is_recurring ? "Каждый месяц" : "Разово"}
              </Badge>
            ),
          },
        ]}
        emptyIcon={TrendingUp}
        emptyTitle="Дополнительных доходов пока нет"
        emptyDescription="Добавьте подработку, аренду, премию или разовый заказ — если они у вас есть."
        emptyActionLabel="Добавить доход"
        addLabel="Добавить доход"
        formComponent={IncomeFormWrapper}
        onDelete={deleteIncome}
        formTitle={{
          create: "Дополнительный доход",
          edit: "Редактировать доход",
        }}
      />
    </div>
  );
}
