"use client";

import { RecordList, Badge, formatCurrency, formatDate } from "@/components/crud/record-list";
import { ExpenseForm } from "@/components/forms/expense-form";
import { PageHeader } from "@/components/layout/page-header";
import { deleteExpense } from "@/lib/actions/finance";
import type { Expense } from "@/types/database";
import { TrendingDown } from "lucide-react";

function ExpenseFormWrapper({
  item,
  onSuccess,
}: {
  item?: Expense;
  onSuccess: () => void;
}) {
  return <ExpenseForm expense={item} onSuccess={onSuccess} />;
}

export function ExpensesPageClient({ expenses }: { expenses: Expense[] }) {
  return (
    <div>
      <PageHeader
        title="Расходы"
        description="Учёт расходов — обязательных и необязательных"
      />
      <RecordList
        items={expenses}
        columns={[
          { key: "title", label: "Название" },
          {
            key: "amount",
            label: "Сумма",
            render: (e) => formatCurrency(e.amount),
          },
          {
            key: "category",
            label: "Категория",
            render: (e) => <Badge>{e.category}</Badge>,
          },
          {
            key: "date",
            label: "Дата",
            render: (e) => formatDate(e.date),
          },
          {
            key: "is_essential",
            label: "Тип",
            render: (e) =>
              e.is_essential ? (
                <Badge variant="warning">Обязательный</Badge>
              ) : (
                <Badge>Необязательный</Badge>
              ),
          },
        ]}
        emptyIcon={TrendingDown}
        emptyTitle="Пока нет расходов"
        emptyDescription="Добавьте обязательные и необязательные расходы."
        emptyActionLabel="Добавить расход"
        addLabel="Добавить расход"
        formComponent={ExpenseFormWrapper}
        onDelete={deleteExpense}
        formTitle={{ create: "Новый расход", edit: "Редактировать расход" }}
      />
    </div>
  );
}
