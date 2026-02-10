import { create } from "zustand";

interface ScoreState {
  score: number;
  streak: number;
  totalConfirmed: number;
  totalFixed: number;
  addScore: (points: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addConfirm: () => void;
  addFix: () => void;
}

export const useScoreStore = create<ScoreState>((set) => ({
  score: 9420,
  streak: 12,
  totalConfirmed: 42,
  totalFixed: 3,

  addScore: (points) => set((s) => ({ score: s.score + points })),
  incrementStreak: () => set((s) => ({ streak: s.streak + 1 })),
  resetStreak: () => set({ streak: 0 }),
  addConfirm: () => set((s) => ({ totalConfirmed: s.totalConfirmed + 1 })),
  addFix: () => set((s) => ({ totalFixed: s.totalFixed + 1 })),
}));
