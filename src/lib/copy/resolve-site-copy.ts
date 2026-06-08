import {
  SITE_COPY_DEFAULTS,
  SITE_COPY_DEFINITIONS,
  type SiteCopyDefinition,
} from "@/lib/copy/site-copy-defaults";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type ResolvedSiteCopy = Record<string, string>;

async function loadSiteCopyOverrides(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_copy").select("key, value");

  if (error) {
    console.warn("[site_copy] failed to load overrides:", error.message);
    return {};
  }

  const overrides: Record<string, string> = {};
  for (const row of data ?? []) {
    if (typeof row.key === "string" && typeof row.value === "string") {
      overrides[row.key] = row.value;
    }
  }
  return overrides;
}

/** Per-request dedupe; must not use unstable_cache here (reads cookies via Supabase). */
export const getResolvedSiteCopy = cache(async (): Promise<ResolvedSiteCopy> => {
  try {
    const overrides = await loadSiteCopyOverrides();
    return { ...SITE_COPY_DEFAULTS, ...overrides };
  } catch (error) {
    console.warn("[site_copy] using defaults:", error);
    return { ...SITE_COPY_DEFAULTS };
  }
});

export function resolveCopyValue(
  copy: ResolvedSiteCopy,
  key: string,
  fallback?: string
): string {
  return copy[key] ?? fallback ?? SITE_COPY_DEFAULTS[key] ?? key;
}

export function getSiteCopyDefinitionsWithValues(
  copy: ResolvedSiteCopy
): (SiteCopyDefinition & { value: string; isCustom: boolean })[] {
  return SITE_COPY_DEFINITIONS.map((definition) => ({
    ...definition,
    value: copy[definition.key] ?? definition.defaultValue,
    isCustom:
      copy[definition.key] !== undefined &&
      copy[definition.key] !== definition.defaultValue,
  }));
}
