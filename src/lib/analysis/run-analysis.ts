export async function runAnalysis(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const res = await fetch("/api/analyze", { method: "POST" });
  const data = (await res.json()) as { error?: string };

  if (!res.ok) {
    return { ok: false, error: data.error || "Ошибка анализа" };
  }

  return { ok: true };
}
