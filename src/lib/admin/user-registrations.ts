import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { safeLogError } from "@/lib/logging/safe-log";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface UserRegistrationRecord {
  id: string;
  created_at: string;
  email?: string | null;
}

export interface UserRegistrationStats {
  totalUsers: number;
  newUsers7d: number;
  cutoffIso: string;
  source: "auth.users" | "user_profiles" | "analytics_events";
  users: UserRegistrationRecord[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function cutoffDaysAgo(days: number): Date {
  return new Date(Date.now() - days * MS_PER_DAY);
}

function countNewSince(
  users: UserRegistrationRecord[],
  cutoff: Date
): number {
  return users.filter((user) => new Date(user.created_at) >= cutoff).length;
}

function logRegistrationDebug(
  source: UserRegistrationStats["source"],
  users: UserRegistrationRecord[],
  cutoffIso: string
) {
  console.log("[admin] user registration stats", {
    source,
    totalUsers: users.length,
    newUsers7d: countNewSince(users, new Date(cutoffIso)),
    cutoffIso,
  });
}

async function loadFromAuthUsers(): Promise<UserRegistrationRecord[]> {
  const supabase = createServiceClient();
  const users: UserRegistrationRecord[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    for (const user of data.users) {
      users.push({
        id: user.id,
        created_at: user.created_at,
        email: user.email ?? null,
      });
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

async function loadFromUserProfiles(): Promise<UserRegistrationRecord[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.user_id,
    created_at: row.created_at,
  }));
}

async function loadFromAnalyticsEvents(): Promise<UserRegistrationRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("user_id, event_name, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const signupAt = new Map<string, string>();
  const firstAt = new Map<string, string>();

  for (const event of data ?? []) {
    const existingFirst = firstAt.get(event.user_id);
    if (!existingFirst || event.created_at < existingFirst) {
      firstAt.set(event.user_id, event.created_at);
    }

    if (event.event_name === PRODUCT_EVENTS.SIGNUP_COMPLETED) {
      const existingSignup = signupAt.get(event.user_id);
      if (!existingSignup || event.created_at < existingSignup) {
        signupAt.set(event.user_id, event.created_at);
      }
    }
  }

  const userIds = new Set([...firstAt.keys(), ...signupAt.keys()]);

  return [...userIds].map((id) => ({
    id,
    created_at: signupAt.get(id) ?? firstAt.get(id)!,
  }));
}

export async function getUserRegistrationStats(
  days = 7
): Promise<UserRegistrationStats> {
  const cutoff = cutoffDaysAgo(days);
  const cutoffIso = cutoff.toISOString();

  const loaders: Array<{
    source: UserRegistrationStats["source"];
    load: () => Promise<UserRegistrationRecord[]>;
  }> = [
    { source: "auth.users", load: loadFromAuthUsers },
    { source: "user_profiles", load: loadFromUserProfiles },
    { source: "analytics_events", load: loadFromAnalyticsEvents },
  ];

  let lastError: unknown = null;

  for (const { source, load } of loaders) {
    try {
      const users = await load();
      const newUsers7d = countNewSince(users, cutoff);

      logRegistrationDebug(source, users, cutoffIso);

      return {
        totalUsers: users.length,
        newUsers7d,
        cutoffIso,
        source,
        users,
      };
    } catch (error) {
      lastError = error;
      console.warn(
        `[admin] failed to load registrations from ${source}`,
        safeLogError(error)
      );
    }
  }

  throw lastError ?? new Error("Unable to load user registration stats");
}

export function newUserIdsSince(
  users: UserRegistrationRecord[],
  cutoff: Date
): Set<string> {
  return new Set(
    users
      .filter((user) => new Date(user.created_at) >= cutoff)
      .map((user) => user.id)
  );
}
