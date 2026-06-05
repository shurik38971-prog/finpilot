"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { Suspense, useEffect, useState } from "react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const param = searchParams.get("email");
    if (param) setEmail(param);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) {
        if (authError.message.includes("email rate limit exceeded")) {
          setError("Слишком много запросов. Попробуйте через 30–60 минут.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }
      try {
        await trackClientEvent(ANALYTICS_EVENTS.SIGNUP);
      } catch (eventError) {
        console.error("Failed to track signup event:", eventError);
      }
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      router.push("/login?message=check_email");
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось создать аккаунт. Попробуйте ещё раз."
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo variant="stacked" iconSize={40} />
        </div>

        <div className="glass p-8">
          <h1 className="text-xl font-semibold mb-1">Регистрация</h1>
          <p className="text-sm text-muted mb-6">
            Начните управлять финансами умнее
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
              minLength={6}
              placeholder="Минимум 6 символов"
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Создание..." : "Создать аккаунт"}
            </Button>
          </form>

          <p className="text-sm text-muted text-center mt-6">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
