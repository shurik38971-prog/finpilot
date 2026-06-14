"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    trackClientEvent(ANALYTICS_EVENTS.LOGIN);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo variant="stacked" iconSize={40} href="/" />
        </div>

        <div className="glass p-8">
          <h1 className="text-xl font-semibold mb-1">Вход</h1>
          <p className="text-sm text-muted mb-6">
            Ваш персональный финансовый директор
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <Input
              id="password"
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <p className="text-sm text-muted text-center mt-6">
            Нет аккаунта?{" "}
            <Link href="/signup" className="text-accent hover:underline">
              Зарегистрироваться
            </Link>
            {" · "}
            <Link href="/" className="text-muted hover:text-foreground hover:underline">
              О сервисе
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
