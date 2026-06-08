"use client";

import {
  adminAddAdminEmail,
  adminRemoveAdminEmail,
} from "@/lib/actions/admin-system";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AdminSystemClient({
  initialEmails,
}: {
  initialEmails: string[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await adminAddAdminEmail(email);
        setEmail("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  function handleRemove(target: string) {
    if (!confirm(`Удалить ${target} из админов?`)) return;
    startTransition(async () => {
      try {
        await adminRemoveAdminEmail(target);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Система</h1>
        <p className="text-sm text-muted mt-1">
          Управление доступом к админке и переменными окружения
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-base">Администраторы (admin_users)</CardTitle>

          <form onSubmit={handleAdd} className="flex flex-wrap gap-2 max-w-lg">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 min-w-[220px]"
              required
            />
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Добавить"}
            </Button>
          </form>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <ul className="space-y-2">
            {initialEmails.length === 0 ? (
              <li className="text-sm text-muted">Список пуст</li>
            ) : (
              initialEmails.map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2 text-sm"
                >
                  <span>{item}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400"
                    disabled={pending}
                    onClick={() => handleRemove(item)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))
            )}
          </ul>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="space-y-2 text-sm text-muted">
          <CardTitle className="text-base text-foreground">
            Переменные окружения
          </CardTitle>
          <p>
            Также проверьте <code className="text-accent">ADMIN_EMAILS</code> на
            Vercel — email через запятую даёт доступ даже без записи в БД.
          </p>
          <p>
            Для CRUD данных пользователей нужен{" "}
            <code className="text-accent">SUPABASE_SERVICE_ROLE_KEY</code>.
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
