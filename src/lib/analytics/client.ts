"use client";

import {
  ANALYTICS_EVENTS,
  type AnalyticsEventPayload,
} from "@/lib/analytics/events";

const SESSION_KEY = "finpilot:session_id";
const FIRST_CLICK_KEY = "finpilot:first_click_sent";

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const eventQueue: AnalyticsEventPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export async function flushAnalyticsNow() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flushEvents();
}

const APP_SESSION_KEY = "finpilot:app_session_started";

export async function trackAppSessionStarted(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(APP_SESSION_KEY)) return false;

  sessionStorage.setItem(APP_SESSION_KEY, "1");
  trackClientEvent(ANALYTICS_EVENTS.APP_SESSION_STARTED);
  await flushAnalyticsNow();
  return true;
}

async function flushEvents() {
  if (eventQueue.length === 0) return;
  const batch = eventQueue.splice(0, 20);
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
    eventQueue.unshift(...batch);
  }
}

export function trackClientEvent(
  event_name: AnalyticsEventPayload["event_name"],
  options?: Omit<AnalyticsEventPayload, "event_name" | "session_id">
) {
  if (typeof window === "undefined") return;

  eventQueue.push({
    event_name,
    session_id: getAnalyticsSessionId(),
    page_path: options?.page_path ?? window.location.pathname,
    element_id: options?.element_id,
    properties: options?.properties,
  });

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushEvents();
  }, 400);
}

export function trackPageView(path: string) {
  trackClientEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
    page_path: path,
    properties: { referrer: document.referrer || null },
  });
}

export function trackFirstClick(target: HTMLElement) {
  if (sessionStorage.getItem(FIRST_CLICK_KEY)) return;

  const label =
    target.getAttribute("data-analytics-label") ||
    target.getAttribute("aria-label") ||
    target.textContent?.trim().slice(0, 80) ||
    target.tagName.toLowerCase();

  const elementId =
    target.getAttribute("data-analytics-id") ||
    target.id ||
    target.getAttribute("href") ||
    undefined;

  sessionStorage.setItem(FIRST_CLICK_KEY, "1");
  trackClientEvent(ANALYTICS_EVENTS.FIRST_CLICK, {
    element_id: elementId,
    properties: { label },
  });
}

export function trackButtonClick(elementId: string, label?: string) {
  trackClientEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
    element_id: elementId,
    properties: { label },
  });
}
