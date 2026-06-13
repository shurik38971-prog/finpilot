"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Banknote,
  ClipboardCheck,
  Receipt,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";

const QUICK_ACTIONS = [
  {
    href: "/income",
    label: "Добавить новый доход",
    icon: Banknote,
  },
  {
    href: "/expenses",
    label: "Добавить расход",
    icon: Receipt,
  },
  {
    href: "/goals",
    label: "Обновить цель",
    icon: Target,
  },
  {
    href: "/debts",
    label: "Проверить долги",
    icon: Wallet,
  },
  {
    href: "/actions",
    label: "Записать результат шага",
    icon: ClipboardCheck,
  },
] as const;

export function EscapePlanQuickActionsBlock() {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Быстрые действия</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:border-accent/40 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <action.icon className="size-4 shrink-0 text-muted" />
                  <CardTitle className="text-sm font-medium leading-snug">
                    {action.label}
                  </CardTitle>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
