"use client";

import type { ResolvedSiteCopy } from "@/lib/copy/resolve-site-copy";
import { SITE_COPY_DEFAULTS } from "@/lib/copy/site-copy-defaults";
import { createContext, useContext, useMemo } from "react";

const SiteCopyContext = createContext<ResolvedSiteCopy>(SITE_COPY_DEFAULTS);

export function SiteCopyProvider({
  copy,
  children,
}: {
  copy: ResolvedSiteCopy;
  children: React.ReactNode;
}) {
  const value = useMemo(() => copy, [copy]);
  return (
    <SiteCopyContext.Provider value={value}>{children}</SiteCopyContext.Provider>
  );
}

export function useSiteCopy() {
  return useContext(SiteCopyContext);
}

export function useCopy(key: string, fallback?: string): string {
  const copy = useSiteCopy();
  return copy[key] ?? fallback ?? SITE_COPY_DEFAULTS[key] ?? key;
}
