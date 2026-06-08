"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import {
  SITE_COPY_DEFAULTS,
  SITE_COPY_DEFINITIONS,
  isSiteCopyKey,
} from "@/lib/copy/site-copy-defaults";
import { getResolvedSiteCopy } from "@/lib/copy/resolve-site-copy";
import { revalidatePath, revalidateTag } from "next/cache";

export async function adminGetSiteCopyEditorData() {
  const { service } = await requireAdmin();
  const copy = await getResolvedSiteCopy();
  const { data: rows } = await service.from("site_copy").select("key, updated_at");

  const updatedAt = new Map(
    (rows ?? []).map((row) => [row.key as string, row.updated_at as string])
  );

  return SITE_COPY_DEFINITIONS.map((definition) => ({
    ...definition,
    value: copy[definition.key],
    isCustom: updatedAt.has(definition.key),
    updatedAt: updatedAt.get(definition.key) ?? null,
  }));
}

export async function adminUpdateSiteCopy(key: string, value: string) {
  if (!isSiteCopyKey(key)) {
    throw new Error("Неизвестный ключ текста");
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Текст не может быть пустым");
  }

  const { service } = await requireAdmin();

  if (trimmed === SITE_COPY_DEFAULTS[key]) {
    const { error } = await service.from("site_copy").delete().eq("key", key);
    if (error) throw error;
  } else {
    const { error } = await service.from("site_copy").upsert(
      {
        key,
        value: trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) throw error;
  }

  revalidateSiteCopy();
}

export async function adminResetSiteCopyKey(key: string) {
  if (!isSiteCopyKey(key)) {
    throw new Error("Неизвестный ключ текста");
  }

  const { service } = await requireAdmin();
  const { error } = await service.from("site_copy").delete().eq("key", key);
  if (error) throw error;

  revalidateSiteCopy();
}

export async function adminResetAllSiteCopy() {
  const { service } = await requireAdmin();
  const { error } = await service
    .from("site_copy")
    .delete()
    .neq("key", "__never__");
  if (error) throw error;

  revalidateSiteCopy();
}

function revalidateSiteCopy() {
  revalidateTag("site-copy");
  revalidatePath("/", "layout");
  revalidatePath("/admin/copy");
}
