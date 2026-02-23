/** Achievement API client. */
import { endpoints } from "./endpoints";
import { authFetch } from "./auth-fetch";
import type { Achievement, UserAchievement } from "@/types/achievement";

export async function fetchAchievements(): Promise<Achievement[]> {
  const res = await fetch(endpoints.achievements.list);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchMyAchievements(): Promise<UserAchievement[]> {
  const res = await authFetch(endpoints.achievements.me);
  if (!res.ok) return [];
  return res.json();
}

export async function unlockAchievement(achievementId: string): Promise<UserAchievement | null> {
  const res = await authFetch(endpoints.achievements.unlock, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ achievement_id: achievementId }),
  });
  if (!res.ok) return null;
  return res.json();
}
