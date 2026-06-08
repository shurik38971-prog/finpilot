"use client";

import {
  adminResetAllSiteCopy,
  adminResetSiteCopyKey,
  adminUpdateSiteCopy,
} from "@/lib/actions/admin-site-copy";
import {
  SITE_COPY_GROUP_LABELS,
  type SiteCopyGroup,
} from "@/lib/copy/site-copy-defaults";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

interface SiteCopyEditorItem {
  key: string;
  defaultValue: string;
  group: SiteCopyGroup;
  label: string;
  value: string;
  isCustom: boolean;
  updatedAt: string | null;
}

export function SiteCopyAdminClient({
  initialItems,
}: {
  initialItems: SiteCopyEditorItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState<SiteCopyGroup | "all">("all");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const groups = useMemo(() => {
    const set = new Set(items.map((item) => item.group));
    return [...set];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (activeGroup !== "all" && item.group !== activeGroup) return false;
      if (!q) return true;
      return (
        item.key.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q)
      );
    });
  }, [items, activeGroup, search]);

  function getDraft(item: SiteCopyEditorItem) {
    return drafts[item.key] ?? item.value;
  }

  function handleSave(item: SiteCopyEditorItem) {
    const value = getDraft(item);
    setSavingKey(item.key);
    setError("");
    startTransition(async () => {
      try {
        await adminUpdateSiteCopy(item.key, value);
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[item.key];
          return next;
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка сохранения");
      } finally {
        setSavingKey(null);
      }
    });
  }

  function handleReset(key: string) {
    setSavingKey(key);
    setError("");
    startTransition(async () => {
      try {
        await adminResetSiteCopyKey(key);
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка сброса");
      } finally {
        setSavingKey(null);
      }
    });
  }

  function handleResetAll() {
    if (!confirm("Сбросить все тексты к значениям по умолчанию?")) return;
    setError("");
    startTransition(async () => {
      try {
        await adminResetAllSiteCopy();
        setDrafts({});
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Тексты интерфейса</h1>
          <p className="text-sm text-muted mt-1">
            Меню, заголовки, блоки и кнопки. Изменения появятся на сайте сразу
            после сохранения.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={handleResetAll}
        >
          <RotateCcw className="size-4" />
          Сбросить всё
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по названию или ключу"
      />

      <div className="flex flex-wrap gap-2">
        <FilterButton
          active={activeGroup === "all"}
          onClick={() => setActiveGroup("all")}
          label="Все"
        />
        {groups.map((group) => (
          <FilterButton
            key={group}
            active={activeGroup === group}
            onClick={() => setActiveGroup(group)}
            label={SITE_COPY_GROUP_LABELS[group]}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-4">
        {filtered.map((item) => {
          const draft = getDraft(item);
          const dirty = draft !== item.value;
          const isSaving = savingKey === item.key && pending;

          return (
            <Card key={item.key}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  {item.isCustom && <Badge variant="warning">Изменено</Badge>}
                  <span className="text-xs text-muted font-mono">{item.key}</span>
                </div>

                <p className="text-xs text-muted">
                  По умолчанию: {item.defaultValue}
                </p>

                <textarea
                  className="w-full min-h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  value={draft}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [item.key]: e.target.value,
                    }))
                  }
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={isSaving || !dirty}
                    onClick={() => handleSave(item)}
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Сохранить"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={() => handleReset(item.key)}
                  >
                    Сбросить
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm transition-colors",
        active ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
