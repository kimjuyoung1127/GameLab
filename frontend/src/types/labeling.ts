/** 라벨링 도메인 타입: AISuggestion, Annotation, SuggestionStatus, HistorySnapshot. */
import type { LabelingMode } from "./common";

export type SuggestionStatus = "pending" | "confirmed" | "rejected" | "corrected";

export type SuggestionSource = "ai" | "user";

export interface Suggestion {
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
  source?: SuggestionSource;
  createdBy?: string | null;
}

// Backward compatibility
export type AISuggestion = Suggestion;

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
  suggestions: Suggestion[];
  manualDrafts: ManualDraft[];
  selectedDraftId: string | null;
  loopState: LoopState;
}

export interface ManualDraft {
  id: string;
  audioId: string;
  label: string;
  description: string;
  startTime: number;
  endTime: number;
  freqLow: number;
  freqHigh: number;
  source: "user";
}

export interface LoopState {
  enabled: boolean;
  start: number | null;
  end: number | null;
}

export type BookmarkType = "recheck" | "noise_suspect" | "edge_case";

export interface LabelingBookmark {
  id: string;
  time: number;
  suggestionId?: string;
  type: BookmarkType;
  note: string;
  createdAt: string;
}

export type ActionType =
  | "confirm"
  | "ai_confirm"
  | "reject"
  | "apply_fix"
  | "manual_create"
  | "manual_delete"
  | "manual_move"
  | "manual_resize"
  | "seek"
  | "loop_set"
  | "bookmark"
  | "undo"
  | "redo";

export interface ActionHistoryItem {
  id: string;
  type: ActionType;
  createdAt: string;
  summary: string;
  payload?: {
    time?: number;
    loopStart?: number | null;
    loopEnd?: number | null;
  };
}
