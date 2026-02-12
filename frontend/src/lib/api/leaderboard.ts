const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const leaderboardEndpoints = {
  list: `${API_BASE}/leaderboard`,
} as const;
