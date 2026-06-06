import { Logo } from "@/components/brand/logo";
import Link from "next/link";

interface LegalPageShellProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Logo variant="wordmark" href="/login" iconSize={28} />
          <div className="flex gap-4 text-sm text-muted">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Политика
            </Link>
            <Link href="/consent" className="hover:text-foreground transition-colors">
              Согласие
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Войти
            </Link>
          </div>
        </div>

        <article className="glass p-6 sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <div className="mt-6 space-y-4 text-sm text-muted leading-relaxed">
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}
