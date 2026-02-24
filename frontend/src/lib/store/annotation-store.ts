/** 라벨링 상태 관리: 모드(review/edit), 도구, AI 제안, undo/redo 스택. */
import { create } from "zustand";
import type {
  ActionHistoryItem,
  AISuggestion,
  Annotation,
  BookmarkType,
  LabelingMode,
  LabelingBookmark,
  DrawTool,
  HistorySnapshot,
} from "@/types";

const MAX_HISTORY_ITEMS = 20;

interface AnnotationState {
  mode: LabelingMode;
  tool: DrawTool;
  snapEnabled: boolean;
  suggestions: AISuggestion[];
  annotations: Annotation[];
  bookmarks: LabelingBookmark[];
  history: ActionHistoryItem[];
  selectedSuggestionId: string | null;
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];

  setMode: (mode: LabelingMode) => void;
  setTool: (tool: DrawTool) => void;
  toggleSnap: () => void;
  selectSuggestion: (id: string | null) => void;
  confirmSuggestion: () => { points: number } | null;
  rejectSuggestion: () => void;
  applyFix: () => { points: number } | null;
  undo: () => void;
  redo: () => void;
  addBookmark: (input: {
    time: number;
    type: BookmarkType;
    note: string;
    suggestionId?: string;
  }) => void;
  removeBookmark: (id: string) => void;
  pushHistory: (
    type: ActionHistoryItem["type"],
    summary: string,
    payload?: ActionHistoryItem["payload"],
  ) => void;
  clearHistory: () => void;
  loadSuggestions: (items: AISuggestion[]) => void;
  restoreSuggestions: (suggestions: AISuggestion[]) => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  mode: "review",
  tool: "select",
  snapEnabled: true,
  suggestions: [],
  annotations: [],
  bookmarks: [],
  history: [],
  selectedSuggestionId: null,
  undoStack: [],
  redoStack: [],

  setMode: (mode) => set({ mode }),
  setTool: (tool) => set({ tool }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  selectSuggestion: (id) => set({ selectedSuggestionId: id }),

  confirmSuggestion: () => {
    const { suggestions, selectedSuggestionId, mode, undoStack, pushHistory } = get();
    if (!selectedSuggestionId) return null;

    const prevSnapshot: HistorySnapshot = {
      mode,
      selectedSuggestionId,
      suggestions: [...suggestions],
    };
    const updated = suggestions.map((s) =>
      s.id === selectedSuggestionId ? { ...s, status: "confirmed" as const } : s
    );

    const nextPending = updated.find(
      (s) => s.status === "pending" && s.id !== selectedSuggestionId
    );

    set({
      suggestions: updated,
      selectedSuggestionId: nextPending?.id ?? null,
      undoStack: [...undoStack, prevSnapshot],
      redoStack: [],
    });
    pushHistory("confirm", "Confirmed selected suggestion");

    return { points: 10 };
  },

  rejectSuggestion: () => {
    const { suggestions, selectedSuggestionId, mode, undoStack, pushHistory } = get();
    if (!selectedSuggestionId) return;

    const prevSnapshot: HistorySnapshot = {
      mode,
      selectedSuggestionId,
      suggestions: [...suggestions],
    };
    const updated = suggestions.map((s) =>
      s.id === selectedSuggestionId ? { ...s, status: "rejected" as const } : s
    );

    set({
      suggestions: updated,
      mode: "edit",
      undoStack: [...undoStack, prevSnapshot],
      redoStack: [],
    });
    pushHistory("reject", "Rejected selected suggestion");
  },

  applyFix: () => {
    const { suggestions, selectedSuggestionId, mode, undoStack, pushHistory } = get();
    if (!selectedSuggestionId) return null;

    const prevSnapshot: HistorySnapshot = {
      mode,
      selectedSuggestionId,
      suggestions: [...suggestions],
    };
    const updated = suggestions.map((s) =>
      s.id === selectedSuggestionId ? { ...s, status: "corrected" as const } : s
    );

    const nextPending = updated.find((s) => s.status === "pending");

    set({
      suggestions: updated,
      mode: "review",
      selectedSuggestionId: nextPending?.id ?? null,
      undoStack: [...undoStack, prevSnapshot],
      redoStack: [],
    });
    pushHistory("apply_fix", "Applied fix for rejected suggestion");

    return { points: 20 };
  },

  undo: () => {
    const { undoStack, suggestions, mode, selectedSuggestionId, redoStack, pushHistory } = get();
    if (undoStack.length === 0) return;

    const prev = undoStack[undoStack.length - 1];
    const currentSnapshot: HistorySnapshot = {
      mode,
      selectedSuggestionId,
      suggestions: [...suggestions],
    };

    set({
      mode: prev.mode,
      selectedSuggestionId: prev.selectedSuggestionId,
      suggestions: prev.suggestions,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, currentSnapshot],
    });
    pushHistory("undo", "Undo latest action");
  },

  redo: () => {
    const { redoStack, suggestions, mode, selectedSuggestionId, undoStack, pushHistory } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    const currentSnapshot: HistorySnapshot = {
      mode,
      selectedSuggestionId,
      suggestions: [...suggestions],
    };

    set({
      mode: next.mode,
      selectedSuggestionId: next.selectedSuggestionId,
      suggestions: next.suggestions,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, currentSnapshot],
    });
    pushHistory("redo", "Redo latest action");
  },

  addBookmark: ({ time, type, note, suggestionId }) => {
    const item: LabelingBookmark = {
      id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      time,
      type,
      note,
      suggestionId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ bookmarks: [item, ...state.bookmarks] }));
    get().pushHistory("bookmark", `Added bookmark: ${type}`);
  },

  removeBookmark: (id) => {
    set((state) => ({ bookmarks: state.bookmarks.filter((item) => item.id !== id) }));
  },

  pushHistory: (type, summary, payload) => {
    const item: ActionHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      summary,
      createdAt: new Date().toISOString(),
      payload,
    };
    set((state) => ({
      history: [item, ...state.history].slice(0, MAX_HISTORY_ITEMS),
    }));
  },

  clearHistory: () => set({ history: [] }),

  loadSuggestions: (items) => {
    set({
      suggestions: items,
      selectedSuggestionId: items.find((s) => s.status === "pending")?.id ?? null,
      mode: "review",
      undoStack: [],
      redoStack: [],
      history: [],
      bookmarks: [],
    });
  },

  restoreSuggestions: (savedSuggestions) => {
    set({
      suggestions: savedSuggestions,
      selectedSuggestionId:
        savedSuggestions.find((s) => s.status === "pending")?.id ?? null,
      mode: "review",
      undoStack: [],
      redoStack: [],
    });
  },
}));
