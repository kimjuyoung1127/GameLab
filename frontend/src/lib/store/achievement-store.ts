/** Achievement state: definitions, unlocked set, rule checking. */
import { create } from "zustand";
import type { Achievement } from "@/types/achievement";
import { fetchAchievements, fetchMyAchievements, unlockAchievement } from "@/lib/api/achievement";
import { useScoreStore } from "./score-store";

interface AchievementState {
  achievements: Achievement[];
  unlocked: Set<string>;
  recentUnlock: Achievement | null;
  loaded: boolean;
  load: () => Promise<void>;
  checkAndUnlock: () => Promise<void>;
  clearRecent: () => void;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: [],
  unlocked: new Set(),
  recentUnlock: null,
  loaded: false,

  load: async () => {
    try {
      const [allAch, userAch] = await Promise.all([fetchAchievements(), fetchMyAchievements()]);
      set({
        achievements: allAch,
        unlocked: new Set(userAch.map((ua) => ua.achievement_id)),
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  checkAndUnlock: async () => {
    const { achievements, unlocked } = get();
    const { totalConfirmed, totalFixed, streak, allTimeScore, dailyProgress, dailyGoal } =
      useScoreStore.getState();

    const total = totalConfirmed + totalFixed;

    const rules: Record<string, boolean> = {
      "first-confirm": totalConfirmed >= 1,
      "first-fix": totalFixed >= 1,
      "ten-confirms": totalConfirmed >= 10,
      "fifty-confirms": totalConfirmed >= 50,
      "hundred-labels": total >= 100,
      "streak-5": streak >= 5,
      "streak-10": streak >= 10,
      "score-500": allTimeScore >= 500,
      "score-5000": allTimeScore >= 5000,
      "daily-goal": dailyProgress >= dailyGoal,
    };

    try {
      for (const ach of achievements) {
        if (unlocked.has(ach.id)) continue;
        if (rules[ach.id]) {
          const result = await unlockAchievement(ach.id);
          if (result) {
            set((s) => ({
              unlocked: new Set([...s.unlocked, ach.id]),
              recentUnlock: ach,
            }));
          }
        }
      }
    } catch {
      // Non-fatal: network/auth misconfiguration should not break labeling flow.
    }
  },

  clearRecent: () => set({ recentUnlock: null }),
}));
