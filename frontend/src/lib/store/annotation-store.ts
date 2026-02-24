/** Labeling store: AI suggestion review + manual draft editing with undo/redo snapshots. */
import { create } from "zustand";
import type {
  ActionHistoryItem,
  BookmarkType,
  DrawTool,
  HistorySnapshot,
  LabelingBookmark,
  LabelingMode,
  LoopState,
  ManualDraft,
  Suggestion,
} from "@/types";

const MAX_HISTORY_ITEMS = 20;

interface AnnotationState {
  mode: LabelingMode;
  tool: DrawTool;
  snapEnabled: boolean;
  suggestions: Suggestion[];
  manualDrafts: ManualDraft[];
  selectedDraftId: string | null;
  loopState: LoopState;
  bookmarks: LabelingBookmark[];
  history: ActionHistoryItem[];
  selectedSuggestionId: string | null;
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];

  setMode: (mode: LabelingMode) => void;
  setTool: (tool: DrawTool) => void;
  toggleSnap: () => void;
  setLoopState: (next: Partial<LoopState>) => void;
  selectSuggestion: (id: string | null) => void;
  selectDraft: (id: string | null) => void;
  startDraft: (input: Omit<ManualDraft, "id" | "source">) => string;
  updateDraft: (
    id: string,
    patch: Partial<ManualDraft>,
    options?: { trackHistory?: boolean },
  ) => void;
  removeDraft: (id: string) => void;
  clearDrafts: () => void;
  saveDraftsSuccess: (created: Suggestion[], removedDraftIds: string[]) => void;
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
  loadSuggestions: (items: Suggestion[]) => void;
  restoreSuggestions: (suggestions: Suggestion[]) => void;
}

function makeSnapshot(state: AnnotationState): HistorySnapshot {
  return {
    mode: state.mode,
    selectedSuggestionId: state.selectedSuggestionId,
    suggestions: [...state.suggestions],
    manualDrafts: [...state.manualDrafts],
    selectedDraftId: state.selectedDraftId,
    loopState: { ...state.loopState },
  };
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  mode: "review",
  tool: "select",
  snapEnabled: true,
  suggestions: [],
  manualDrafts: [],
  selectedDraftId: null,
  loopState: { enabled: false, start: null, end: null },
  bookmarks: [],
  history: [],
  selectedSuggestionId: null,
  undoStack: [],
  redoStack: [],

  setMode: (mode) => set({ mode }),
  setTool: (tool) => set({ tool }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  setLoopState: (next) => {
    const state = get();
    const prev = makeSnapshot(state);
    set({
      loopState: { ...state.loopState, ...next },
      undoStack: [...state.undoStack, prev],
      redoStack: [],
    });
  },

  selectSuggestion: (id) => set({ selectedSuggestionId: id, selectedDraftId: null }),
  selectDraft: (id) => set({ selectedDraftId: id, selectedSuggestionId: null }),

  startDraft: (input) => {
    const state = get();
    const id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const prev = makeSnapshot(state);
    const draft: ManualDraft = { id, source: "user", ...input };
    set({
      manualDrafts: [...state.manualDrafts, draft],
      selectedDraftId: id,
      selectedSuggestionId: null,
      undoStack: [...state.undoStack, prev],
      redoStack: [],
    });
    return id;
  },

  updateDraft: (id, patch, options) => {
    if (options?.trackHistory) {
      const state = get();
      const prev = makeSnapshot(state);
      set({
        manualDrafts: state.manualDrafts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        undoStack: [...state.undoStack, prev],
        redoStack: [],
      });
      return;
    }
    set((state) => ({
      manualDrafts: state.manualDrafts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  },

  removeDraft: (id) => {
    const state = get();
    const prev = makeSnapshot(state);
    set({
      manualDrafts: state.manualDrafts.filter((d) => d.id !== id),
      selectedDraftId: state.selectedDraftId === id ? null : state.selectedDraftId,
      undoStack: [...state.undoStack, prev],
      redoStack: [],
    });
    get().pushHistory("manual_delete", "Removed manual draft");
  },

  clearDrafts: () => set({ manualDrafts: [], selectedDraftId: null }),

  saveDraftsSuccess: (created, removedDraftIds) => {
    const state = get();
    const prev = makeSnapshot(state);
    set({
      suggestions: [...created, ...state.suggestions],
      manualDrafts: state.manualDrafts.filter((d) => !removedDraftIds.includes(d.id)),
      selectedDraftId: null,
      undoStack: [...state.undoStack, prev],
      redoStack: [],
    });
    get().pushHistory("manual_create", `Saved ${created.length} manual suggestion(s)`);
  },

  confirmSuggestion: () => {
    const state = get();
    const { suggestions, selectedSuggestionId } = state;
    if (!selectedSuggestionId) return null;
    const target = suggestions.find((s) => s.id === selectedSuggestionId);
    if (!target || target.source === "user") return null;

    const prev = makeSnapshot(state);
    const updated = suggestions.map((s) =>
      s.id === selectedSuggestionId ? { ...s, status: "confirmed" as const } : s,
    );
    const nextPending = updated.find((s) => s.status === "pending" && s.id !== selectedSuggestionId);

    set({
      suggestions: updated,
      selectedSuggestionId: nextPending?.id ?? null,
      undoStack: [...state.undoStack, prev],
      redoStack: [],
    });
    get().pushHistory("ai_confirm", "Confirmed selected AI suggestion");
    return { points: 10 };
  },

  rejectSuggestion: () => {
    const state = get();
    const { suggestions, selectedSuggestionId } = state;
    if (!selectedSuggestionId) return;
    const prev = makeSnapshot(state);
    const updated = suggestions.map((s) =>
      s.id === selectedSuggestionId ? { ...s, status: "rejected" as const } : s,
    );
    set({
      suggestions: updated,
      mode: "edit",
      undoStack: [...state.undoStack, prev],
      redoStack: [],
    });
    get().pushHistory("reject", "Rejected selected suggestion");
  },

  applyFix: () => {
    const state = get();
    const { suggestions, selectedSuggestionId } = state;
    if (!selectedSuggestionId) return null;
    const prev = makeSnapshot(state);
    const updated = suggestions.map((s) =>
      s.id === selectedSuggestionId ? { ...s, status: "corrected" as const } : s,
    );
    const nextPending = updated.find((s) => s.status === "pending");
    set({
      suggestions: updated,
      mode: "review",
      selectedSuggestionId: nextPending?.id ?? null,
      undoStack: [...state.undoStack, prev],
      redoStack: [],
    });
    get().pushHistory("apply_fix", "Applied fix for rejected suggestion");
    return { points: 20 };
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const prev = state.undoStack[state.undoStack.length - 1];
    const current = makeSnapshot(state);
    set({
      mode: prev.mode,
      selectedSuggestionId: prev.selectedSuggestionId,
      suggestions: prev.suggestions,
      manualDrafts: prev.manualDrafts,
      selectedDraftId: prev.selectedDraftId,
      loopState: prev.loopState,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, current],
    });
    get().pushHistory("undo", "Undo latest action");
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const next = state.redoStack[state.redoStack.length - 1];
    const current = makeSnapshot(state);
    set({
      mode: next.mode,
      selectedSuggestionId: next.selectedSuggestionId,
      suggestions: next.suggestions,
      manualDrafts: next.manualDrafts,
      selectedDraftId: next.selectedDraftId,
      loopState: next.loopState,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, current],
    });
    get().pushHistory("redo", "Redo latest action");
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
      manualDrafts: [],
      selectedDraftId: null,
      loopState: { enabled: false, start: null, end: null },
    });
  },

  restoreSuggestions: (savedSuggestions) => {
    set({
      suggestions: savedSuggestions,
      selectedSuggestionId: savedSuggestions.find((s) => s.status === "pending")?.id ?? null,
      mode: "review",
      undoStack: [],
      redoStack: [],
    });
  },
}));
