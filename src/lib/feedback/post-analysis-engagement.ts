const STORAGE_KEY = "finpilot:post_analysis_engagement";

interface EngagementState {
  analysisAt: number;
  accumulatedMs: number;
  lastTickAt: number | null;
}

function readState(): EngagementState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EngagementState;
  } catch {
    return null;
  }
}

function writeState(state: EngagementState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function markAnalysisCompleted() {
  const now = Date.now();
  writeState({
    analysisAt: now,
    accumulatedMs: 0,
    lastTickAt: now,
  });
}

export function tickPostAnalysisEngagement() {
  const state = readState();
  if (!state || typeof document === "undefined") return;
  if (document.visibilityState !== "visible") return;

  const now = Date.now();
  const last = state.lastTickAt ?? state.analysisAt;
  const delta = now - last;

  if (delta > 0 && delta <= 10 * 60 * 1000) {
    state.accumulatedMs += delta;
  }

  state.lastTickAt = now;
  writeState(state);
}

export function getPostAnalysisEngagementMinutes(): number {
  tickPostAnalysisEngagement();
  const state = readState();
  if (!state) return 0;
  return Math.floor(state.accumulatedMs / (60 * 1000));
}
