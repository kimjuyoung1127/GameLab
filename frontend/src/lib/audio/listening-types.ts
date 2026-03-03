import type { ManualDraft, Suggestion } from "@/types";

export type ListeningMode = "original" | "filtered";

export type ListeningSelection = {
  timeStartSec: number;
  timeEndSec: number;
  freqLowHz: number;
  freqHighHz: number;
};

export type SelectionSource = {
  kind: "suggestion" | "manual_draft" | "custom";
  id: string | null;
};

export type ListeningTarget = {
  selection: ListeningSelection;
  source: SelectionSource;
};

export type FilterConfig = {
  order: number;
  normalize: boolean;
  q?: number;
  method: "biquad_chain";
};

export type PlaybackConfig = {
  rate: number;
  preservePitch?: boolean;
};

export type ListeningState = {
  enabled: boolean;
  mode: ListeningMode;
  target: ListeningTarget | null;
};

export function fromSuggestionSelection(input: Suggestion): ListeningSelection {
  return {
    timeStartSec: input.startTime,
    timeEndSec: input.endTime,
    freqLowHz: input.freqLow,
    freqHighHz: input.freqHigh,
  };
}

export function fromManualDraftSelection(input: ManualDraft): ListeningSelection {
  return {
    timeStartSec: input.startTime,
    timeEndSec: input.endTime,
    freqLowHz: input.freqLow,
    freqHighHz: input.freqHigh,
  };
}

export function clampSelection(input: ListeningSelection, maxFrequency: number): ListeningSelection {
  const timeStartSec = Math.max(0, Math.min(input.timeStartSec, input.timeEndSec));
  const timeEndSec = Math.max(timeStartSec, input.timeEndSec);
  const freqHighBound = Math.max(1, maxFrequency);
  const freqLowHz = Math.max(0, Math.min(input.freqLowHz, input.freqHighHz, freqHighBound - 1));
  const freqHighHz = Math.max(freqLowHz + 1, Math.min(input.freqHighHz, freqHighBound));

  return {
    timeStartSec,
    timeEndSec,
    freqLowHz,
    freqHighHz,
  };
}
