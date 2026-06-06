"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  className?: string;
  lines?: 2 | 3;
}

export function ExpandableText({
  text,
  className,
  lines = 2,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.length > 100;

  return (
    <div className={className}>
      <p
        className={cn(
          "text-sm text-muted leading-snug",
          !expanded && lines === 2 && "line-clamp-2",
          !expanded && lines === 3 && "line-clamp-3"
        )}
      >
        {text}
      </p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-accent hover:text-accent/80 transition-colors"
        >
          {expanded ? "Свернуть" : "Подробнее"}
        </button>
      )}
    </div>
  );
}
