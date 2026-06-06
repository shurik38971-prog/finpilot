import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import {
  cutoffDaysAgo,
  type UserRegistrationRecord,
} from "@/lib/admin/user-registrations";

export interface AnalyticsEventRow {
  user_id: string;
  event_name: string;
  created_at: string;
}

export interface UserActivityMetrics {
  activeUsers24h: number;
  activeUsers7d: number;
  dashboardOpens7d: number;
}

export interface AdminUserActivityRow {
  userId: string;
  email: string | null;
  registeredAt: string;
  lastActivityAt: string | null;
  isNew7d: boolean;
  isActive7d: boolean;
}

export function computeUserActivityMetrics(
  events: AnalyticsEventRow[]
): UserActivityMetrics {
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const cutoff7d = cutoffDaysAgo(7);

  const active24h = new Set<string>();
  const active7d = new Set<string>();
  let dashboardOpens7d = 0;

  for (const event of events) {
    const at = new Date(event.created_at);
    if (at >= cutoff7d) {
      active7d.add(event.user_id);
      if (event.event_name === PRODUCT_EVENTS.DASHBOARD_OPENED) {
        dashboardOpens7d += 1;
      }
    }
    if (at >= cutoff24h) {
      active24h.add(event.user_id);
    }
  }

  return {
    activeUsers24h: active24h.size,
    activeUsers7d: active7d.size,
    dashboardOpens7d,
  };
}

export function computeLastActivityByUser(
  events: AnalyticsEventRow[]
): Map<string, string> {
  const map = new Map<string, string>();

  for (const event of events) {
    const existing = map.get(event.user_id);
    if (!existing || event.created_at > existing) {
      map.set(event.user_id, event.created_at);
    }
  }

  return map;
}

export function buildAdminUserActivityRows(
  users: UserRegistrationRecord[],
  lastActivityByUser: Map<string, string>,
  cutoff7d: Date
): AdminUserActivityRow[] {
  return users
    .map((user) => {
      const lastActivityAt = lastActivityByUser.get(user.id) ?? null;
      const isNew7d = new Date(user.created_at) >= cutoff7d;
      const isActive7d =
        lastActivityAt !== null && new Date(lastActivityAt) >= cutoff7d;

      return {
        userId: user.id,
        email: user.email ?? null,
        registeredAt: user.created_at,
        lastActivityAt,
        isNew7d,
        isActive7d,
      };
    })
    .sort((a, b) => {
      const aTime = a.lastActivityAt ?? a.registeredAt;
      const bTime = b.lastActivityAt ?? b.registeredAt;
      return bTime.localeCompare(aTime);
    });
}
