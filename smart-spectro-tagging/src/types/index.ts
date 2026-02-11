// === Session ===
export type SessionStatus = "pending" | "processing" | "completed";

export interface Session {
  id: string;
  name: string;
  deviceType: string;
  status: SessionStatus;
  fileCount: number;
  progress: number;
  score: number | null;
  createdAt: string;
}

// === Audio File ===
export type FileStatus = "wip" | "pending" | "done";

export interface AudioFile {
  id: string;
  sessionId: string;
  filename: string;
  duration: string;
  sampleRate: string;
  status: FileStatus;
}

// === AI Suggestion ===
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

// === Annotation ===
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

// === Score ===
export interface SessionScore {
  sessionId: string;
  confirmCount: number;
  fixCount: number;
  score: number;
  streak: number;
}

// === User ===
export type UserRole = "lead_analyst" | "acoustic_eng" | "data_analyst" | "junior_tagger" | "contractor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  todayScore: number;
  accuracy: number;
  allTimeScore: number;
}

// === Labeling Mode ===
export type LabelingMode = "review" | "edit";
export type DrawTool = "select" | "brush" | "eraser" | "box" | "anchor";

export interface HistorySnapshot {
  mode: LabelingMode;
  selectedSuggestionId: string | null;
  suggestions: AISuggestion[];
}
