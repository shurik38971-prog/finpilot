"use server";

import {
  getEntitySchema,
  type AdminEntitySchema,
  type AdminFieldSchema,
} from "@/lib/admin/entity-schemas";
import { requireAdmin } from "@/lib/admin/require-admin";
import { revalidatePath } from "next/cache";

function revalidateAdminUser(userId: string) {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/feedback");
}

function schemaKeys(schema: AdminEntitySchema): Set<string> {
  return new Set(schema.fields.map((field) => field.key));
}

function coerceValue(field: AdminFieldSchema, raw: unknown): unknown {
  if (raw === "" || raw === null || raw === undefined) {
    if (field.type === "boolean") return false;
    if (field.type === "number") return null;
    return null;
  }

  switch (field.type) {
    case "number":
      return Number(raw);
    case "boolean":
      return raw === true || raw === "true" || raw === "on" || raw === 1;
    case "json":
      if (typeof raw === "string") {
        try {
          return JSON.parse(raw);
        } catch {
          throw new Error(`Некорректный JSON в поле «${field.label}»`);
        }
      }
      return raw;
    default:
      return String(raw);
  }
}

function buildPayload(
  schema: AdminEntitySchema,
  input: Record<string, unknown>,
  forCreate: boolean
) {
  const allowed = schemaKeys(schema);
  const payload: Record<string, unknown> = {};

  for (const field of schema.fields) {
    if (!forCreate && field.createOnly) continue;
    if (!(field.key in input)) continue;
    payload[field.key] = coerceValue(field, input[field.key]);
  }

  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) continue;
    if (key in payload) continue;
    const field = schema.fields.find((item) => item.key === key);
    if (!field) continue;
    payload[key] = coerceValue(field, input[key]);
  }

  return payload;
}

export async function adminListEntityRecords(
  entityKey: string,
  userId: string
): Promise<Record<string, unknown>[]> {
  const schema = getEntitySchema(entityKey);
  if (!schema) throw new Error("Unknown entity");

  const { service } = await requireAdmin();

  if (schema.singleton) {
    const lookupKey = schema.idKey === "user_id" ? "user_id" : "user_id";
    const { data, error } = await service
      .from(schema.table)
      .select("*")
      .eq(lookupKey, userId)
      .maybeSingle();

    if (error) throw error;
    return data ? [data as Record<string, unknown>] : [];
  }

  const { data, error } = await service
    .from(schema.table)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

export async function adminCreateEntityRecord(
  entityKey: string,
  userId: string,
  input: Record<string, unknown>
) {
  const schema = getEntitySchema(entityKey);
  if (!schema) throw new Error("Unknown entity");
  if (schema.readonly) throw new Error("Read-only entity");

  const { service } = await requireAdmin();
  const payload = buildPayload(schema, input, true);

  if (schema.singleton) {
    const conflictKey = schema.idKey === "user_id" ? "user_id" : "user_id";
    const { data, error } = await service
      .from(schema.table)
      .upsert(
        {
          ...payload,
          user_id: userId,
          ...(schema.idKey === "user_id" ? { user_id: userId } : {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: conflictKey }
      )
      .select("*")
      .single();

    if (error) throw error;
    revalidateAdminUser(userId);
    return data;
  }

  const { data, error } = await service
    .from(schema.table)
    .insert({ ...payload, user_id: userId })
    .select("*")
    .single();

  if (error) throw error;
  revalidateAdminUser(userId);
  return data;
}

export async function adminUpdateEntityRecord(
  entityKey: string,
  userId: string,
  recordId: string,
  input: Record<string, unknown>
) {
  const schema = getEntitySchema(entityKey);
  if (!schema) throw new Error("Unknown entity");
  if (schema.readonly) throw new Error("Read-only entity");

  const { service } = await requireAdmin();
  const payload = buildPayload(schema, input, false);
  const idKey = schema.idKey ?? "id";

  const query = service.from(schema.table).update({
    ...payload,
    ...(schema.table === "user_profiles" || schema.table === "onboarding_progress"
      ? { updated_at: new Date().toISOString() }
      : {}),
  });

  if (schema.singleton) {
    let builder = query.eq("user_id", userId);
    if (schema.idKey !== "user_id" && recordId) {
      builder = builder.eq("id", recordId);
    }
    const { data, error } = await builder.select("*").single();
    if (error) throw error;
    revalidateAdminUser(userId);
    return data;
  }

  const { data, error } = await query
    .eq(idKey, recordId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  revalidateAdminUser(userId);
  return data;
}

export async function adminDeleteEntityRecord(
  entityKey: string,
  userId: string,
  recordId: string
) {
  const schema = getEntitySchema(entityKey);
  if (!schema) throw new Error("Unknown entity");
  if (schema.singleton) {
    throw new Error("Нельзя удалить единственную запись — отредактируйте поля");
  }

  const { service } = await requireAdmin();
  const idKey = schema.idKey ?? "id";

  const { error } = await service
    .from(schema.table)
    .delete()
    .eq(idKey, recordId)
    .eq("user_id", userId);

  if (error) throw error;
  revalidateAdminUser(userId);
}

export async function adminRestartOnboarding(userId: string) {
  const { service } = await requireAdmin();

  const { error } = await service.from("onboarding_progress").upsert(
    {
      user_id: userId,
      profile_done: false,
      income_done: false,
      expenses_done: false,
      debts_done: false,
      goal_done: false,
      analysis_done: false,
      completed: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
  revalidateAdminUser(userId);
}

export async function adminClearUserAnalyses(userId: string) {
  const { service } = await requireAdmin();

  const tables = [
    "financial_tasks",
    "analyses",
    "task_recommendation_ratings",
    "analysis_ratings",
  ] as const;

  for (const table of tables) {
    const { error } = await service.from(table).delete().eq("user_id", userId);
    if (error) throw error;
  }

  revalidateAdminUser(userId);
}
