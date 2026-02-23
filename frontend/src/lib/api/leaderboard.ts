/** Leaderboard API client. */
import { authFetch } from "./auth-fetch";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const leaderboardEndpoints = {
  list: `${API_BASE}/leaderboard`,
  me: `${API_BASE}/leaderboard/me`,
} as const;

export async function fetchMyScore(): Promise<{
  todayScore: number;
  accuracy: number;
  allTimeScore: number;
} | null> {
  try {
    const res = await authFetch(leaderboardEndpoints.me);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
