import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo variant="wordmark" href="/" iconSize={28} />
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted hover:text-foreground">
                Войти
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-lg">
                Регистрация
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-2 sm:px-6">{children}</main>
    </div>
  );
}
