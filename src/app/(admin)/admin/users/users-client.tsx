"use client";

import { adminListUsers, type AdminUserListItem } from "@/lib/actions/admin-users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

function formatAdminDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminUsersClient({
  initialUsers,
}: {
  initialUsers: AdminUserListItem[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await adminListUsers(search);
      setUsers(result);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <p className="text-sm text-muted mt-1">
          Полное редактирование данных любого пользователя
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 max-w-xl">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Email или ID"
          className="flex-1 min-w-[220px]"
        />
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Найти"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setSearch("");
            startTransition(async () => setUsers(await adminListUsers()));
          }}
        >
          Сбросить
        </Button>
      </form>

      <Card>
        <CardHeader className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Регистрация</th>
                  <th className="px-4 py-3 text-left font-medium">Активность</th>
                  <th className="px-4 py-3 text-left font-medium">Метки</th>
                  <th className="px-4 py-3 text-right font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      Пользователи не найдены
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 hover:bg-surface-hover/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.email ?? "—"}</div>
                        <div className="text-xs text-muted font-mono mt-0.5">
                          {user.id.slice(0, 8)}…
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatAdminDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatAdminDate(user.last_activity_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.badges.map((badge) => (
                            <Badge key={badge} variant="default">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button size="sm">Редактировать</Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardHeader>
      </Card>

      <p className="text-sm text-muted">Всего: {users.length}</p>
    </div>
  );
}
