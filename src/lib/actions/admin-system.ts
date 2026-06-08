"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { revalidatePath } from "next/cache";

export async function adminListAdminEmails(): Promise<string[]> {
  const { service } = await requireAdmin();
  const { data, error } = await service
    .from("admin_users")
    .select("email")
    .order("email");

  if (error) throw error;
  return (data ?? []).map((row) => row.email as string);
}

export async function adminAddAdminEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new Error("Некорректный email");
  }

  const { service } = await requireAdmin();
  const { error } = await service
    .from("admin_users")
    .upsert({ email: normalized }, { onConflict: "email" });

  if (error) throw error;
  revalidatePath("/admin/system");
}

export async function adminRemoveAdminEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const { service, user } = await requireAdmin();

  if (user.email?.toLowerCase() === normalized) {
    throw new Error("Нельзя удалить себя из списка админов");
  }

  const { error } = await service
    .from("admin_users")
    .delete()
    .eq("email", normalized);

  if (error) throw error;
  revalidatePath("/admin/system");
}

export async function adminListAllFeedback(limit = 100) {
  const { service } = await requireAdmin();

  const [legacy, messages, widget] = await Promise.all([
    service
      .from("feedback")
      .select("id, user_id, rating_score, confusion_text, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    service
      .from("feedback_messages")
      .select("id, user_id, type, message, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    service
      .from("user_feedback")
      .select("id, user_id, feedback_type, message, page_path, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (legacy.error) throw legacy.error;
  if (messages.error) throw messages.error;
  if (widget.error) throw widget.error;

  return {
    legacy: legacy.data ?? [],
    messages: messages.data ?? [],
    widget: widget.data ?? [],
  };
}

export async function adminDeleteFeedbackRecord(
  table: "feedback" | "feedback_messages" | "user_feedback",
  id: string
) {
  const { service } = await requireAdmin();
  const { error } = await service.from(table).delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/feedback");
}
