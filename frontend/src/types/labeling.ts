import type { LabelingMode } from "./common";

export type SuggestionStatus = "pending" | "confirmed" | "rejected" | "corrected";

export interface AISuggestion {
  id: string;
  audioId: string;
  label: string;
  confidence: number;
  description: string;
  startTime: number;
  endTime: number;
  freqLow: number;
  freqHigh: number;
  status: SuggestionStatus;
}

export interface Annotation {
  id: string;
  suggestionId: string;
  source: "ai" | "user";
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label: string;
}

export interface SessionScore {
  sessionId: string;
  confirmCount: number;
  fixCount: number;
  score: number;
  streak: number;
}

export interface HistorySnapshot {
  mode: LabelingMode;
  selectedSuggestionId: string | null;
  suggestions: AISuggestion[];
}
