/** Leaderboard API client. */
import { authFetch } from "./auth-fetch";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const leaderboardEndpoints = {
  list: `${API_BASE}/leaderboard`,
  me: `${API_BASE}/leaderboard/me`,
  listByScope: (scope: "daily" | "weekly" | "all_time") => `${API_BASE}/leaderboard?scope=${scope}`,
  meByScope: (scope: "daily" | "weekly" | "all_time") => `${API_BASE}/leaderboard/me?scope=${scope}`,
} as const;

export async function fetchMyScore(): Promise<{
  todayScore: number;
  accuracy: number;
  allTimeScore: number;
} | null> {
  return fetchMyScoreByScope("daily");
}

export async function fetchMyScoreByScope(scope: "daily" | "weekly" | "all_time"): Promise<{
  todayScore: number;
  accuracy: number;
  allTimeScore: number;
} | null> {
  try {
    const res = await authFetch(leaderboardEndpoints.meByScope(scope));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
