import { FinPilotIcon } from "@/components/brand/finpilot-icon";
import { cn } from "@/lib/utils";
import Link from "next/link";

const BRAND_BLUE = "#3B82F6";

type LogoVariant = "primary" | "icon" | "stacked" | "wordmark";

type LogoProps = {
  variant?: LogoVariant;
  className?: string;
  href?: string;
  iconSize?: number;
  /** For dark backgrounds */
  theme?: "dark" | "light";
};

function Wordmark({
  theme,
  accent = false,
}: {
  theme: "dark" | "light";
  accent?: boolean;
}) {
  const finColor = theme === "dark" ? "#FFFFFF" : "#0B0F19";
  const pilotColor = accent ? BRAND_BLUE : finColor;

  return (
    <span
      className="font-semibold tracking-tight"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <span style={{ color: finColor }}>Fin</span>
      <span style={{ color: pilotColor }}>Pilot</span>
    </span>
  );
}

export function Logo({
  variant = "primary",
  className,
  href,
  iconSize,
  theme = "dark",
}: LogoProps) {
  const iconColor = theme === "dark" ? BRAND_BLUE : BRAND_BLUE;
  const size = iconSize ?? (variant === "stacked" ? 40 : variant === "wordmark" ? 28 : 32);

  const content = (() => {
    switch (variant) {
      case "icon":
        return <FinPilotIcon size={size} color={iconColor} />;

      case "stacked":
        return (
          <div className="flex flex-col items-center gap-3">
            <FinPilotIcon size={size} color={iconColor} />
            <span className="text-xl">
              <Wordmark theme={theme} accent />
            </span>
          </div>
        );

      case "wordmark":
        return (
          <div className="flex items-center gap-2.5">
            <FinPilotIcon size={size} color={iconColor} />
            <span className="text-lg">
              <Wordmark theme={theme} accent />
            </span>
          </div>
        );

      case "primary":
      default:
        return (
          <div className="flex items-center gap-3">
            <FinPilotIcon size={size} color={iconColor} />
            <span className="text-xl">
              <Wordmark theme={theme} />
            </span>
          </div>
        );
    }
  })();

  const wrapperClass = cn("inline-flex items-center", className);

  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label="FinPilot">
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
