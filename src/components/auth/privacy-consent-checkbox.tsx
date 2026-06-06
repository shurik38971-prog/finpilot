import Link from "next/link";
import { cn } from "@/lib/utils";

interface PrivacyConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function PrivacyConsentCheckbox({
  checked,
  onChange,
  className,
}: PrivacyConsentCheckboxProps) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 cursor-pointer text-sm text-muted leading-relaxed",
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-border bg-surface accent-accent"
      />
      <span>
        Я принимаю условия{" "}
        <Link
          href="/privacy"
          target="_blank"
          className="text-accent hover:underline"
        >
          Политики конфиденциальности
        </Link>{" "}
        и даю согласие на{" "}
        <Link
          href="/consent"
          target="_blank"
          className="text-accent hover:underline"
        >
          обработку персональных данных
        </Link>
        .
      </span>
    </label>
  );
}
