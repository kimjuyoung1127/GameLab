/** 점수/게이미피케이션 상태: 서버 동기화 + 낙관적 업데이트. persist 미들웨어. */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchMyScore } from "@/lib/api/leaderboard";
import { fetchGamificationSnapshot } from "@/lib/api/gamification";
import type { GamificationSnapshot, RewardEvent } from "@/types/gamification";

/* ------------------------------------------------------------------ */
/*  Level system (pure frontend calculation)                           */
/* ------------------------------------------------------------------ */
export interface LevelInfo {
  level: number;
  name: string;
  nameKo: string;
  nextThreshold: number;
  progress: number; // 0~1
  color: string;
}

const LEVELS = [
  { level: 1, name: "Rookie",       nameKo: "새내기",       min: 0,      max: 100,   color: "text-text-muted" },
  { level: 2, name: "Apprentice",   nameKo: "견습생",       min: 100,    max: 500,   color: "text-blue-400" },
  { level: 3, name: "Analyst",      nameKo: "분석가",       min: 500,    max: 1500,  color: "text-green-400" },
  { level: 4, name: "Expert",       nameKo: "전문가",       min: 1500,   max: 5000,  color: "text-purple-400" },
  { level: 5, name: "Master",       nameKo: "마스터",       min: 5000,   max: 15000, color: "text-orange-400" },
  { level: 6, name: "Grand Master", nameKo: "그랜드마스터", min: 15000,  max: Infinity, color: "text-yellow-400" },
] as const;

export function getLevel(allTimeScore: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (allTimeScore >= LEVELS[i].min) {
      const lv = LEVELS[i];
      const range = lv.max === Infinity ? 1 : lv.max - lv.min;
      const progress = lv.max === Infinity ? 1 : Math.min((allTimeScore - lv.min) / range, 1);
      return {
        level: lv.level,
        name: lv.name,
        nameKo: lv.nameKo,
        nextThreshold: lv.max === Infinity ? lv.min : lv.max,
        progress,
        color: lv.color,
      };
    }
  }
  return { level: 1, name: "Rookie", nameKo: "새내기", nextThreshold: 100, progress: 0, color: "text-text-muted" };
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */
interface ScoreState {
  score: number;
  streak: number;
  totalConfirmed: number;
  totalFixed: number;
  allTimeScore: number;
  dailyGoal: number;
  dailyProgress: number;
  serverSynced: boolean;
  snapshot: GamificationSnapshot | null;
  addScore: (points: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addConfirm: () => void;
  addFix: () => void;
  setDailyGoal: (goal: number) => void;
  incrementDailyProgress: () => void;
  fetchFromServer: () => Promise<void>;
  refreshGamificationSnapshot: () => Promise<void>;
  applyOptimisticReward: (event: Pick<RewardEvent, "points">) => void;
}

export const useScoreStore = create<ScoreState>()(
  persist(
    (set) => ({
      score: 0,
      streak: 0,
      totalConfirmed: 0,
      totalFixed: 0,
      allTimeScore: 0,
      dailyGoal: 20,
      dailyProgress: 0,
      serverSynced: false,
      snapshot: null,

      addScore: (points) => set((s) => ({ score: s.score + points, allTimeScore: s.allTimeScore + points })),
      incrementStreak: () => set((s) => ({ streak: s.streak + 1 })),
      resetStreak: () => set({ streak: 0 }),
      addConfirm: () => set((s) => ({ totalConfirmed: s.totalConfirmed + 1 })),
      addFix: () => set((s) => ({ totalFixed: s.totalFixed + 1 })),
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      incrementDailyProgress: () => set((s) => ({ dailyProgress: s.dailyProgress + 1 })),

      fetchFromServer: async () => {
        const snapshot = await fetchGamificationSnapshot();
        if (snapshot) {
          set({
            score: snapshot.todayScore,
            allTimeScore: snapshot.allTimeScore,
            dailyGoal: snapshot.dailyGoal,
            dailyProgress: snapshot.dailyProgress,
            snapshot,
            serverSynced: true,
          });
          return;
        }

        const data = await fetchMyScore();
        if (data) {
          set({ score: data.todayScore, allTimeScore: data.allTimeScore, serverSynced: true });
        }
      },

      refreshGamificationSnapshot: async () => {
        const snapshot = await fetchGamificationSnapshot();
        if (!snapshot) return;
        set({
          score: snapshot.todayScore,
          allTimeScore: snapshot.allTimeScore,
          dailyGoal: snapshot.dailyGoal,
          dailyProgress: snapshot.dailyProgress,
          snapshot,
          serverSynced: true,
        });
      },

      applyOptimisticReward: ({ points }) =>
        set((s) => ({
          score: s.score + points,
          allTimeScore: s.allTimeScore + points,
        })),
    }),
    {
      name: "sst-score",
      version: 3,
      partialize: (state) => ({
        score: state.score,
        streak: state.streak,
        totalConfirmed: state.totalConfirmed,
        totalFixed: state.totalFixed,
        allTimeScore: state.allTimeScore,
        dailyGoal: state.dailyGoal,
        dailyProgress: state.dailyProgress,
        snapshot: state.snapshot,
      }),
      migrate: () => ({
        score: 0,
        streak: 0,
        totalConfirmed: 0,
        totalFixed: 0,
        allTimeScore: 0,
        dailyGoal: 20,
        dailyProgress: 0,
        snapshot: null,
      }),
    }
  )
);
