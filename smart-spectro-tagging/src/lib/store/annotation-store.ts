import { create } from "zustand";
import type { AISuggestion, Annotation, LabelingMode, DrawTool } from "@/types";
import { mockSuggestions } from "@/lib/mock/data";

interface AnnotationState {
  mode: LabelingMode;
  tool: DrawTool;
  snapEnabled: boolean;
  suggestions: AISuggestion[];
  annotations: Annotation[];
  selectedSuggestionId: string | null;
  undoStack: AISuggestion[][];
  redoStack: AISuggestion[][];

  setMode: (mode: LabelingMode) => void;
  setTool: (tool: DrawTool) => void;
  toggleSnap: () => void;
  selectSuggestion: (id: string | null) => void;
  confirmSuggestion: () => { points: number } | null;
  rejectSuggestion: () => void;
  applyFix: () => { points: number } | null;
  undo: () => void;
  redo: () => void;
  loadSuggestions: (audioId: string) => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  mode: "review",
  tool: "select",
  snapEnabled: true,
  suggestions: mockSuggestions.filter((s) => s.audioId === "af-1"),
  annotations: [],
  selectedSuggestionId: mockSuggestions[0]?.id ?? null,
  undoStack: [],
  redoStack: [],

  setMode: (mode) => set({ mode }),
  setTool: (tool) => set({ tool }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  selectSuggestion: (id) => set({ selectedSuggestionId: id }),

  confirmSuggestion: () => {
    const { suggestions, selectedSuggestionId, undoStack } = get();
    if (!selectedSuggestionId) return null;

    const prevSuggestions = [...suggestions];
    const updated = suggestions.map((s) =>
      s.id === selectedSuggestionId ? { ...s, status: "confirmed" as const } : s
    );

    const nextPending = updated.find(
      (s) => s.status === "pending" && s.id !== selectedSuggestionId
    );

    set({
      suggestions: updated,
      selectedSuggestionId: nextPending?.id ?? null,
      undoStack: [...undoStack, prevSuggestions],
      redoStack: [],
    });

    return { points: 10 };
  },

  rejectSuggestion: () => {
    const { suggestions, selectedSuggestionId, undoStack } = get();
    if (!selectedSuggestionId) return;

    const prevSuggestions = [...suggestions];
    const updated = suggestions.map((s) =>
      s.id === selectedSuggestionId ? { ...s, status: "rejected" as const } : s
    );

    set({
      suggestions: updated,
      mode: "edit",
      undoStack: [...undoStack, prevSuggestions],
      redoStack: [],
    });
  },

  applyFix: () => {
    const { suggestions, selectedSuggestionId, undoStack } = get();
    if (!selectedSuggestionId) return null;

    const prevSuggestions = [...suggestions];
    const updated = suggestions.map((s) =>
      s.id === selectedSuggestionId ? { ...s, status: "corrected" as const } : s
    );

    const nextPending = updated.find((s) => s.status === "pending");

    set({
      suggestions: updated,
      mode: "review",
      selectedSuggestionId: nextPending?.id ?? null,
      undoStack: [...undoStack, prevSuggestions],
      redoStack: [],
    });

    return { points: 20 };
  },

  undo: () => {
    const { undoStack, suggestions, redoStack } = get();
    if (undoStack.length === 0) return;

    const prev = undoStack[undoStack.length - 1];
    set({
      suggestions: prev,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, suggestions],
    });
  },

  redo: () => {
    const { redoStack, suggestions, undoStack } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    set({
      suggestions: next,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, suggestions],
    });
  },

  loadSuggestions: (audioId) => {
    const filtered = mockSuggestions.filter((s) => s.audioId === audioId);
    set({
      suggestions: filtered,
      selectedSuggestionId: filtered.find((s) => s.status === "pending")?.id ?? null,
      mode: "review",
      undoStack: [],
      redoStack: [],
    });
  },
}));
