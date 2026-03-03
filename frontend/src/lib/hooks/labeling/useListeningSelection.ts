"use client";

import { useCallback, useMemo, useState } from "react";
import type { ManualDraft, Suggestion } from "@/types";
import {
  clampSelection,
  fromManualDraftSelection,
  fromSuggestionSelection,
  type ListeningSelection,
  type ListeningTarget,
} from "@/lib/audio/listening-types";

type UseListeningSelectionParams = {
  enabled: boolean;
  selectedSuggestionId: string | null;
  selectedDraftId: string | null;
  suggestions: Suggestion[];
  manualDrafts: ManualDraft[];
  maxFrequency: number;
};

type UseListeningSelectionResult = {
  selection: ListeningSelection | null;
  target: ListeningTarget | null;
  setCustomSelection: (selection: ListeningSelection) => void;
  clearCustomSelection: () => void;
};

export function useListeningSelection({
  enabled,
  selectedSuggestionId,
  selectedDraftId,
  suggestions,
  manualDrafts,
  maxFrequency,
}: UseListeningSelectionParams): UseListeningSelectionResult {
  const [customSelection, setCustomSelectionState] = useState<ListeningSelection | null>(null);

  const target = useMemo<ListeningTarget | null>(() => {
    if (!enabled) return null;

    if (customSelection) {
      return {
        selection: clampSelection(customSelection, maxFrequency),
        source: { kind: "custom", id: null },
      };
    }

    if (selectedDraftId) {
      const draft = manualDrafts.find((item) => item.id === selectedDraftId);
      if (draft) {
        return {
          selection: clampSelection(fromManualDraftSelection(draft), maxFrequency),
          source: { kind: "manual_draft", id: draft.id },
        };
      }
    }

    if (selectedSuggestionId) {
      const suggestion = suggestions.find((item) => item.id === selectedSuggestionId);
      if (suggestion) {
        return {
          selection: clampSelection(fromSuggestionSelection(suggestion), maxFrequency),
          source: { kind: "suggestion", id: suggestion.id },
        };
      }
    }

    return null;
  }, [
    customSelection,
    enabled,
    manualDrafts,
    maxFrequency,
    selectedDraftId,
    selectedSuggestionId,
    suggestions,
  ]);

  const setCustomSelection = useCallback(
    (selection: ListeningSelection) => {
      setCustomSelectionState(clampSelection(selection, maxFrequency));
    },
    [maxFrequency],
  );

  const clearCustomSelection = useCallback(() => {
    setCustomSelectionState(null);
  }, []);

  return {
    selection: target?.selection ?? null,
    target,
    setCustomSelection,
    clearCustomSelection,
  };
}
