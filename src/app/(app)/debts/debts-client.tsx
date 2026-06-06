"use client";

import { RecordList, Badge, formatCurrency } from "@/components/crud/record-list";
import { DebtForm } from "@/components/forms/debt-form";
import { PageHeader } from "@/components/layout/page-header";
import { deleteDebt } from "@/lib/actions/finance";
import type { Debt } from "@/types/database";
import { CreditCard } from "lucide-react";

function DebtFormWrapper({
  item,
  onSuccess,
}: {
  item?: Debt;
  onSuccess: () => void;
}) {
  return <DebtForm debt={item} onSuccess={onSuccess} />;
}

export function DebtsPageClient({ debts }: { debts: Debt[] }) {
  return (
    <div>
      <PageHeader
        title="Долги"
        description="Управление кредитами, займами и задолженностями"
      />
      <RecordList
        items={debts}
        columns={[
          { key: "title", label: "Название" },
          {
            key: "remaining_amount",
            label: "Остаток",
            render: (d) => formatCurrency(d.remaining_amount),
          },
          {
            key: "interest_rate",
            label: "Ставка",
            render: (d) => `${d.interest_rate}%`,
          },
          {
            key: "minimum_payment",
            label: "Мин. платёж",
            render: (d) => formatCurrency(d.minimum_payment),
          },
          {
            key: "due_day",
            label: "День",
            render: (d) => (d.due_day ? `${d.due_day}-е` : "—"),
          },
          {
            key: "progress",
            label: "Прогресс",
            render: (d) => {
              const pct =
                d.total_amount > 0
                  ? Math.round(
                      ((d.total_amount - d.remaining_amount) / d.total_amount) *
                        100
                    )
                  : 0;
              return <Badge variant="success">{pct}% погашено</Badge>;
            },
          },
        ]}
        emptyIcon={CreditCard}
        emptyTitle="Долгов нет — это отлично"
        emptyDescription="Если у вас есть кредиты, рассрочки или займы, добавьте их для более точного анализа."
        emptyActionLabel="Добавить долг"
        emptyTone="positive"
        addLabel="Добавить долг"
        formComponent={DebtFormWrapper}
        onDelete={deleteDebt}
        formTitle={{ create: "Новый долг", edit: "Редактировать долг" }}
      />
    </div>
  );
}
