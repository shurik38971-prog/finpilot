"use client";

import { RecordList, Badge, formatCurrency, formatDate } from "@/components/crud/record-list";
import { IncomeForm } from "@/components/forms/income-form";
import { PageHeader } from "@/components/layout/page-header";
import { deleteIncome } from "@/lib/actions/finance";
import { resolveIncomeType } from "@/lib/finance/income-model";
import type { Income } from "@/types/database";
import { INCOME_TYPE_LABELS } from "@/types/database";
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
        title="Доходы"
        description="Фактические поступления денег"
      />

      {showIncomeExpectationsHint && (
        <div className="mb-6 rounded-xl border border-border/60 bg-surface-hover/30 p-4 space-y-3">
          <p className="text-sm text-muted leading-relaxed">
            Здесь отображаются фактические поступления. Сценарии плохого и
            хорошего месяца (и автоматический базовый прогноз) настраиваются в
            финансовом профиле.
          </p>
          <Link
            href="/settings#income-expectations"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border"
          >
            <Settings2 className="h-4 w-4" />
            Изменить ожидания дохода
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
            key: "income_type",
            label: "Тип",
            render: (i) => (
              <Badge
                variant={resolveIncomeType(i) === "expected" ? "warning" : "success"}
              >
                {INCOME_TYPE_LABELS[resolveIncomeType(i)]}
              </Badge>
            ),
          },
        ]}
        emptyIcon={TrendingUp}
        emptyTitle="Пока нет доходов"
        emptyDescription="Добавьте первое поступление — оплату от клиента, проект или консультацию."
        emptyActionLabel="Добавить доход"
        addLabel="Добавить доход"
        formComponent={IncomeFormWrapper}
        onDelete={deleteIncome}
        formTitle={{ create: "Новый доход", edit: "Редактировать доход" }}
      />
    </div>
  );
}
