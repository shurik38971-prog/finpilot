"use client";

import { RecordList, Badge, formatCurrency, formatDate } from "@/components/crud/record-list";
import { IncomeForm } from "@/components/forms/income-form";
import { PageHeader } from "@/components/layout/page-header";
import { deleteIncome } from "@/lib/actions/finance";
import { resolveIncomeType } from "@/lib/finance/income-model";
import type { Income } from "@/types/database";
import { INCOME_TYPE_LABELS } from "@/types/database";
import { TrendingUp } from "lucide-react";

function IncomeFormWrapper({
  item,
  onSuccess,
}: {
  item?: Income;
  onSuccess: () => void;
}) {
  return <IncomeForm income={item} onSuccess={onSuccess} />;
}

export function IncomePageClient({ incomes }: { incomes: Income[] }) {
  return (
    <div>
      <PageHeader
        title="Доходы"
        description="Ожидаемый доход и фактические поступления для самозанятых"
      />
      <p className="mb-6 text-sm text-muted leading-relaxed max-w-3xl">
        Для самозанятых доход может быть нестабильным, поэтому FinPilot сравнивает
        фактические поступления с ожидаемым доходом и средним доходом за прошлые
        месяцы.
      </p>
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
        emptyTitle="Нет доходов"
        emptyDescription="Добавьте ожидаемый доход или фактическое поступление"
        addLabel="Добавить доход"
        formComponent={IncomeFormWrapper}
        onDelete={deleteIncome}
        formTitle={{ create: "Новый доход", edit: "Редактировать доход" }}
      />
    </div>
  );
}
