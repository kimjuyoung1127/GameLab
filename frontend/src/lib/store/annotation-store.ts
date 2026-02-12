import { create } from "zustand";
import type {
  AISuggestion,
  Annotation,
  LabelingMode,
  DrawTool,
  HistorySnapshot,
} from "@/types";

interface AnnotationState {
  mode: LabelingMode;
  tool: DrawTool;
  snapEnabled: boolean;
  suggestions: AISuggestion[];
  annotations: Annotation[];
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
  loadSuggestions: (items: AISuggestion[]) => void;
  restoreSuggestions: (suggestions: AISuggestion[]) => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  mode: "review",
  tool: "select",
  snapEnabled: true,
  suggestions: [],
  annotations: [],
  selectedSuggestionId: null,
  undoStack: [],
  redoStack: [],

  setMode: (mode) => set({ mode }),
  setTool: (tool) => set({ tool }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  selectSuggestion: (id) => set({ selectedSuggestionId: id }),

  confirmSuggestion: () => {
    const { suggestions, selectedSuggestionId, mode, undoStack } = get();
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

    return { points: 10 };
  },

  rejectSuggestion: () => {
    const { suggestions, selectedSuggestionId, mode, undoStack } = get();
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
  },

  applyFix: () => {
    const { suggestions, selectedSuggestionId, mode, undoStack } = get();
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

    return { points: 20 };
  },

  undo: () => {
    const { undoStack, suggestions, mode, selectedSuggestionId, redoStack } = get();
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
  },

  redo: () => {
    const { redoStack, suggestions, mode, selectedSuggestionId, undoStack } = get();
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
  },

  loadSuggestions: (items) => {
    set({
      suggestions: items,
      selectedSuggestionId: items.find((s) => s.status === "pending")?.id ?? null,
      mode: "review",
      undoStack: [],
      redoStack: [],
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
