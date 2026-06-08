"use client";

import { adminDeleteFeedbackRecord } from "@/lib/actions/admin-system";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FeedbackData {
  legacy: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  widget: Record<string, unknown>[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU");
}

export function AdminFeedbackClient({
  initialData,
}: {
  initialData: FeedbackData;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDelete(
    table: "feedback" | "feedback_messages" | "user_feedback",
    id: string
  ) {
    if (!confirm("Удалить запись?")) return;
    setLoadingId(id);
    try {
      await adminDeleteFeedbackRecord(table, id);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Обратная связь</h1>
        <p className="text-sm text-muted mt-1">Просмотр и удаление отзывов</p>
      </div>

      <FeedbackSection
        title="Виджет (user_feedback)"
        items={initialData.widget.map((item) => ({
          id: item.id as string,
          userId: item.user_id as string,
          meta: `${item.feedback_type} · ${item.page_path ?? "—"}`,
          body: item.message as string,
          createdAt: item.created_at as string,
          table: "user_feedback" as const,
        }))}
        onDelete={handleDelete}
        loadingId={loadingId}
      />

      <FeedbackSection
        title="Сообщения (feedback_messages)"
        items={initialData.messages.map((item) => ({
          id: item.id as string,
          userId: item.user_id as string,
          meta: String(item.type),
          body: item.message as string,
          createdAt: item.created_at as string,
          table: "feedback_messages" as const,
        }))}
        onDelete={handleDelete}
        loadingId={loadingId}
      />

      <FeedbackSection
        title="Legacy feedback"
        items={initialData.legacy.map((item) => ({
          id: item.id as string,
          userId: item.user_id as string,
          meta: `Оценка: ${item.rating_score ?? "—"}`,
          body: (item.confusion_text as string) ?? "—",
          createdAt: item.created_at as string,
          table: "feedback" as const,
        }))}
        onDelete={handleDelete}
        loadingId={loadingId}
      />
    </div>
  );
}

function FeedbackSection({
  title,
  items,
  onDelete,
  loadingId,
}: {
  title: string;
  items: {
    id: string;
    userId: string;
    meta: string;
    body: string;
    createdAt: string;
    table: "feedback" | "feedback_messages" | "user_feedback";
  }[];
  onDelete: (
    table: "feedback" | "feedback_messages" | "user_feedback",
    id: string
  ) => Promise<void>;
  loadingId: string | null;
}) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Нет записей</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-border/50 p-3 text-sm space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-muted text-xs">
                    {formatDate(item.createdAt)} · {item.meta}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/users/${item.userId}`}>
                      <Button size="sm" variant="secondary">
                        Пользователь
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400"
                      disabled={loadingId === item.id}
                      onClick={() => onDelete(item.table, item.id)}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap">{item.body}</p>
              </li>
            ))}
          </ul>
        )}
      </CardHeader>
    </Card>
  );
}
