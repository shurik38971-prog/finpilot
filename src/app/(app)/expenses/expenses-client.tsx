"use client";

import { RecordList, Badge, formatCurrency, formatDate } from "@/components/crud/record-list";
import { ExpenseForm } from "@/components/forms/expense-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { deleteExpense } from "@/lib/actions/finance";
import type { Expense } from "@/types/database";
import { getExpenseCategoryLabel } from "@/types/database";
import { Pencil, Trash2, TrendingDown } from "lucide-react";

function ExpenseFormWrapper({
  item,
  onSuccess,
}: {
  item?: Expense;
  onSuccess: () => void;
}) {
  return <ExpenseForm expense={item} onSuccess={onSuccess} />;
}

function ExpenseMobileCard({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="glass p-4 space-y-3">
      <div className="space-y-2">
        <div>
          <p className="text-xs text-foreground/70">Название</p>
          <p className="text-base font-medium leading-snug mt-0.5">{expense.title}</p>
        </div>
        <div>
          <p className="text-xs text-foreground/70">Сумма</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">
            {formatCurrency(expense.amount)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <p className="text-xs text-foreground/70">Категория</p>
            <Badge className="mt-1">
              {getExpenseCategoryLabel(expense.category)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-foreground/70">Тип</p>
            <Badge variant={expense.is_essential ? "warning" : "default"} className="mt-1">
              {expense.is_essential ? "Обязательный" : "Необязательный"}
            </Badge>
          </div>
        </div>
        {expense.date && (
          <div>
            <p className="text-xs text-foreground/70">Дата</p>
            <p className="text-sm text-foreground/90 mt-0.5">{formatDate(expense.date)}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 min-h-[44px]"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
          Изменить
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px] text-red-400"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Удалить
        </Button>
      </div>
    </div>
  );
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
            render: (e) => (
              <Badge>{getExpenseCategoryLabel(e.category)}</Badge>
            ),
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
        renderMobileCard={(expense, actions) => (
          <ExpenseMobileCard
            expense={expense}
            onEdit={actions.onEdit}
            onDelete={actions.onDelete}
          />
        )}
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
