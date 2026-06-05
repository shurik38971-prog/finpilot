"use client";

import {
  markReactivationOpened,
  respondToReactivationCampaign,
} from "@/lib/actions/reactivation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ReactivationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignId = searchParams.get("campaign");
  const answerParam = searchParams.get("answer");

  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [showNoForm, setShowNoForm] = useState(answerParam === "no");

  useEffect(() => {
    if (!campaignId) return;
    void markReactivationOpened(campaignId);
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId || answerParam !== "yes" || done) return;

    async function submitYes() {
      setLoading(true);
      try {
        await respondToReactivationCampaign({
          campaignId: campaignId!,
          answer: "yes",
        });
        setDone(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Не удалось сохранить ответ"
        );
      } finally {
        setLoading(false);
      }
    }

    void submitYes();
  }, [campaignId, answerParam, done]);

  async function handleNoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!campaignId) return;
    setLoading(true);
    setError("");
    try {
      await respondToReactivationCampaign({
        campaignId,
        answer: "no",
        note,
      });
      setDone(true);
      setShowNoForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить ответ"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!campaignId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ссылка недействительна</CardTitle>
          <CardDescription>
            Откройте письмо от FinPilot или перейдите в дашборд.
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-5">
          <Link href="/dashboard" className="text-sm text-accent hover:underline">
            На главную →
          </Link>
        </div>
      </Card>
    );
  }

  if (loading && answerParam === "yes" && !done) {
    return (
      <Card className="flex flex-col items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted mt-4">Сохраняем ответ...</p>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            Спасибо за ответ
          </CardTitle>
          <CardDescription>
            Это поможет точнее подбирать рекомендации для вас.
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-5">
          <Link href="/dashboard">
            <Button>Вернуться в FinPilot</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (showNoForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Что помешало?</CardTitle>
          <CardDescription>
            Коротко опишите — мы учтём это в рекомендациях.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleNoSubmit} className="px-5 pb-5 space-y-4">
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Например: не хватило времени, забыла, было непонятно..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Отправка..." : "Отправить ответ"}
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Удалось ли выполнить главное действие?</CardTitle>
        <CardDescription>
          Неделю назад FinPilot предложил вам шаг для улучшения финансов.
        </CardDescription>
      </CardHeader>
      <div className="px-5 pb-5 flex gap-3">
        <Button
          disabled={loading}
          onClick={() =>
            router.push(`/reactivation?campaign=${campaignId}&answer=yes`)
          }
        >
          Да
        </Button>
        <Button
          variant="secondary"
          disabled={loading}
          onClick={() => setShowNoForm(true)}
        >
          Нет
        </Button>
      </div>
      {error && <p className="px-5 pb-5 text-sm text-red-400">{error}</p>}
    </Card>
  );
}

export function ReactivationClient() {
  return (
    <div className="max-w-lg mx-auto py-8">
      <Suspense
        fallback={
          <Card className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </Card>
        }
      >
        <ReactivationForm />
      </Suspense>
    </div>
  );
}
