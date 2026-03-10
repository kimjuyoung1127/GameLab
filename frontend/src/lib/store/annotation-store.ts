/** Labeling store: AI suggestion review + manual draft editing with undo/redo snapshots. */
import { create } from "zustand";
import type {
  ActionHistoryItem,
  AssistStatus,
  BookmarkType,
  DrawTool,
  HistorySnapshot,
  LabelingBookmark,
  LabelingMode,
  LoopState,
  ManualDraft,
  Suggestion,
  SuggestionLlmAssist,
  SuggestionStatus,
} from "@/types";
import { useUIStore } from "./ui-store";

const MAX_HISTORY_ITEMS = 20;
const MAX_UNDO_STACK_SIZE = 50;
function trimStack<T>(stack: T[]): T[] {
  return stack.length > MAX_UNDO_STACK_SIZE ? stack.slice(-MAX_UNDO_STACK_SIZE) : stack;
}

function findNextPendingSuggestionId(
  suggestions: Suggestion[],
  currentSuggestionId: string,
) {
  const currentIdx = suggestions.findIndex((suggestion) => suggestion.id === currentSuggestionId);
  if (currentIdx === -1) return null;

  const after = suggestions.slice(currentIdx + 1).find((suggestion) => suggestion.status === "pending");
  const before = suggestions.slice(0, currentIdx).find((suggestion) => suggestion.status === "pending");
  return (after ?? before)?.id ?? null;
}

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
  statusFilter: SuggestionStatus | "all";
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
  updateSuggestion: (
    id: string,
    patch: Partial<Suggestion>,
    options?: { trackHistory?: boolean },
  ) => void;
  deleteSuggestion: (id: string) => void;
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
  updateBookmark: (id: string, patch: Partial<Pick<LabelingBookmark, "note" | "type">>) => void;
  removeBookmark: (id: string) => void;
  pushHistory: (
    type: ActionHistoryItem["type"],
    summary: string,
    payload?: ActionHistoryItem["payload"],
  ) => void;
  clearHistory: () => void;
  setStatusFilter: (filter: SuggestionStatus | "all") => void;
  loadSuggestions: (items: Suggestion[]) => void;
  restoreSuggestions: (suggestions: Suggestion[]) => void;

  // LLM Assist prefetch state
  assistMap: Record<string, SuggestionLlmAssist>;
  assistStatusMap: Record<string, AssistStatus>;
  autoPrefetchEnabled: boolean;
  setAssistResult: (id: string, result: SuggestionLlmAssist) => void;
  setBulkAssistResults: (results: SuggestionLlmAssist[]) => void;
  setBulkAssistStatus: (ids: string[], status: AssistStatus) => void;
  toggleAutoPrefetch: () => void;
  clearAssistState: () => void;
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
  statusFilter: "all",
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
      undoStack: trimStack([...state.undoStack, prev]),
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
      undoStack: trimStack([...state.undoStack, prev]),
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
        undoStack: trimStack([...state.undoStack, prev]),
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
      undoStack: trimStack([...state.undoStack, prev]),
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
      undoStack: trimStack([...state.undoStack, prev]),
      redoStack: [],
    });
    get().pushHistory("manual_create", `Saved ${created.length} manual suggestion(s)`);
  },

  updateSuggestion: (id, patch, options) => {
    if (options?.trackHistory) {
      const state = get();
      const prev = makeSnapshot(state);
      set({
        suggestions: state.suggestions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        undoStack: trimStack([...state.undoStack, prev]),
        redoStack: [],
      });
      return;
    }
    set((state) => ({
      suggestions: state.suggestions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  },

  deleteSuggestion: (id) => {
    const state = get();
    const prev = makeSnapshot(state);
    set({
      suggestions: state.suggestions.filter((s) => s.id !== id),
      selectedSuggestionId: state.selectedSuggestionId === id ? null : state.selectedSuggestionId,
      undoStack: trimStack([...state.undoStack, prev]),
      redoStack: [],
    });
    get().pushHistory("suggestion_delete", "Deleted saved suggestion");
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
    const { autoAdvance } = useUIStore.getState();
    const nextId = autoAdvance ? findNextPendingSuggestionId(updated, selectedSuggestionId) : null;

    set({
      suggestions: updated,
      selectedSuggestionId: nextId,
      undoStack: trimStack([...state.undoStack, prev]),
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
      undoStack: trimStack([...state.undoStack, prev]),
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
    const { autoAdvance } = useUIStore.getState();
    const nextSuggestionId = autoAdvance
      ? findNextPendingSuggestionId(updated, selectedSuggestionId)
      : selectedSuggestionId;
    set({
      suggestions: updated,
      mode: "review",
      selectedSuggestionId: nextSuggestionId,
      undoStack: trimStack([...state.undoStack, prev]),
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
      redoStack: trimStack([...state.redoStack, current]),
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
      undoStack: trimStack([...state.undoStack, current]),
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

  updateBookmark: (id, patch) => {
    set((state) => ({
      bookmarks: state.bookmarks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
    get().pushHistory("bookmark", "Updated bookmark note");
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

  setStatusFilter: (filter) => set({ statusFilter: filter }),

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
      assistMap: {},
      assistStatusMap: {},
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

  // LLM Assist prefetch state
  assistMap: {},
  assistStatusMap: {},
  autoPrefetchEnabled: true,

  setAssistResult: (id, result) =>
    set((s) => ({
      assistMap: { ...s.assistMap, [id]: result },
      assistStatusMap: { ...s.assistStatusMap, [id]: "cached" as AssistStatus },
    })),

  setBulkAssistResults: (results) =>
    set((s) => {
      const nextMap = { ...s.assistMap };
      const nextStatus = { ...s.assistStatusMap };
      for (const r of results) {
        nextMap[r.suggestionId] = r;
        nextStatus[r.suggestionId] = "cached";
      }
      return { assistMap: nextMap, assistStatusMap: nextStatus };
    }),

  setBulkAssistStatus: (ids, status) =>
    set((s) => {
      const next = { ...s.assistStatusMap };
      for (const id of ids) next[id] = status;
      return { assistStatusMap: next };
    }),

  toggleAutoPrefetch: () =>
    set((s) => ({ autoPrefetchEnabled: !s.autoPrefetchEnabled })),

  clearAssistState: () =>
    set({ assistMap: {}, assistStatusMap: {} }),
}));
