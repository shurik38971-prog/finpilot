"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import {
  buildAdminUserActivityRows,
  computeLastActivityByUser,
} from "@/lib/admin/user-activity";
import {
  cutoffDaysAgo,
  getUserRegistrationStats,
} from "@/lib/admin/user-registrations";
import { revalidatePath } from "next/cache";

export interface AdminUserListItem {
  id: string;
  email: string | null;
  created_at: string;
  last_activity_at: string | null;
  badges: string[];
}

export interface AdminUserDetail {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  counts: {
    incomes: number;
    expenses: number;
    debts: number;
    goals: number;
    tasks: number;
    analyses: number;
    escapePlans: number;
  };
}

async function countForUser(
  service: Awaited<ReturnType<typeof requireAdmin>>["service"],
  table: string,
  userId: string
) {
  const { count, error } = await service
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export async function adminListUsers(
  search?: string
): Promise<AdminUserListItem[]> {
  const { service } = await requireAdmin();
  const stats = await getUserRegistrationStats(90);

  const { data: events, error: eventsError } = await service
    .from("analytics_events")
    .select("user_id, event_name, created_at")
    .order("created_at", { ascending: false })
    .limit(100_000);

  if (eventsError) throw eventsError;

  const lastActivity = computeLastActivityByUser(events ?? []);
  const rows = buildAdminUserActivityRows(
    stats.users,
    lastActivity,
    cutoffDaysAgo(7)
  );

  const normalizedSearch = search?.trim().toLowerCase() ?? "";
  const filtered = normalizedSearch
    ? rows.filter((row) => {
        const email = row.email?.toLowerCase() ?? "";
        const id = row.userId.toLowerCase();
        return email.includes(normalizedSearch) || id.includes(normalizedSearch);
      })
    : rows;

  return filtered.map((row) => ({
    id: row.userId,
    email: row.email,
    created_at: row.registeredAt,
    last_activity_at: row.lastActivityAt,
    badges: [
      ...(row.isNew7d ? ["Новый"] : []),
      ...(row.isActive7d ? ["Активен"] : []),
    ],
  }));
}

export async function adminGetUserDetail(
  userId: string
): Promise<AdminUserDetail> {
  const { service } = await requireAdmin();

  const { data: authData, error: authError } =
    await service.auth.admin.getUserById(userId);

  if (authError || !authData.user) {
    throw new Error("Пользователь не найден");
  }

  const [
    incomes,
    expenses,
    debts,
    goals,
    tasks,
    analyses,
    escapePlans,
  ] = await Promise.all([
    countForUser(service, "incomes", userId),
    countForUser(service, "expenses", userId),
    countForUser(service, "debts", userId),
    countForUser(service, "financial_goals", userId),
    countForUser(service, "financial_tasks", userId),
    countForUser(service, "analyses", userId),
    countForUser(service, "user_escape_plans", userId),
  ]);

  return {
    id: authData.user.id,
    email: authData.user.email ?? null,
    created_at: authData.user.created_at,
    last_sign_in_at: authData.user.last_sign_in_at ?? null,
    counts: {
      incomes,
      expenses,
      debts,
      goals,
      tasks,
      analyses,
      escapePlans,
    },
  };
}

export async function adminDeleteUser(userId: string) {
  const { service, user } = await requireAdmin();

  if (user.id === userId) {
    throw new Error("Нельзя удалить свой аккаунт из админки");
  }

  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) throw error;

  revalidatePath("/admin/users");
}
