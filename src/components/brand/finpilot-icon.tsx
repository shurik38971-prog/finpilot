import { cn } from "@/lib/utils";

const BRAND_BLUE = "#3B82F6";

export function FinPilotIcon({
  className,
  size = 32,
  color = BRAND_BLUE,
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {/* Current position */}
      <circle cx="8.5" cy="23.5" r="3" fill={color} />
      {/* Course line */}
      <path
        d="M8.5 20.5C8.5 15 12.5 10.5 18 9L22.5 7.5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Bearing arrow */}
      <path
        d="M18.5 5.5L25 8.5L18.5 11.5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
