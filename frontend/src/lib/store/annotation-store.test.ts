/** 라벨링 스토어의 AUTO 전이 규칙을 고정하는 단위 테스트다.
 *  confirm/apply-fix와 초기 pending 선택 회귀를 검증한다.
 */
import { beforeEach, describe, expect, it } from "vitest";
import type { Suggestion, SuggestionStatus } from "@/types";
import { useAnnotationStore } from "./annotation-store";
import { useUIStore } from "./ui-store";

function makeSuggestion(id: string, status: SuggestionStatus): Suggestion {
  return {
    id,
    audioId: "audio-1",
    label: `label-${id}`,
    confidence: 80,
    description: `description-${id}`,
    startTime: 1,
    endTime: 2,
    freqLow: 100,
    freqHigh: 500,
    status,
    source: "ai",
  };
}

describe("useAnnotationStore AUTO behavior", () => {
  beforeEach(() => {
    useAnnotationStore.setState(useAnnotationStore.getInitialState(), true);
    useUIStore.setState(useUIStore.getInitialState(), true);
  });

  it("loads the first pending suggestion by default", () => {
    useAnnotationStore.getState().loadSuggestions([
      makeSuggestion("s1", "confirmed"),
      makeSuggestion("s2", "pending"),
      makeSuggestion("s3", "pending"),
    ]);

    expect(useAnnotationStore.getState().selectedSuggestionId).toBe("s2");
  });

  it("moves to the next pending suggestion on confirm when AUTO is on", () => {
    useAnnotationStore.getState().loadSuggestions([
      makeSuggestion("s1", "pending"),
      makeSuggestion("s2", "confirmed"),
      makeSuggestion("s3", "pending"),
    ]);

    const result = useAnnotationStore.getState().confirmSuggestion();
    const state = useAnnotationStore.getState();

    expect(result).toEqual({ points: 10 });
    expect(state.suggestions.find((suggestion) => suggestion.id === "s1")?.status).toBe("confirmed");
    expect(state.selectedSuggestionId).toBe("s3");
  });

  it("does not auto-advance on confirm when AUTO is off", () => {
    useAnnotationStore.getState().loadSuggestions([
      makeSuggestion("s1", "pending"),
      makeSuggestion("s2", "pending"),
    ]);
    useUIStore.setState({ autoAdvance: false });

    useAnnotationStore.getState().confirmSuggestion();

    const state = useAnnotationStore.getState();
    expect(state.suggestions.find((suggestion) => suggestion.id === "s1")?.status).toBe("confirmed");
    expect(state.selectedSuggestionId).toBeNull();
  });

  it("wraps to an earlier pending suggestion when no later pending item exists", () => {
    useAnnotationStore.getState().loadSuggestions([
      makeSuggestion("s1", "pending"),
      makeSuggestion("s2", "confirmed"),
      makeSuggestion("s3", "pending"),
    ]);
    useAnnotationStore.getState().selectSuggestion("s3");

    useAnnotationStore.getState().confirmSuggestion();

    expect(useAnnotationStore.getState().selectedSuggestionId).toBe("s1");
  });

  it("moves to the next pending suggestion on apply fix when AUTO is on", () => {
    useAnnotationStore.setState({
      suggestions: [
        makeSuggestion("s1", "pending"),
        makeSuggestion("s2", "rejected"),
        makeSuggestion("s3", "pending"),
      ],
      selectedSuggestionId: "s2",
      mode: "edit",
    });

    const result = useAnnotationStore.getState().applyFix();
    const state = useAnnotationStore.getState();

    expect(result).toEqual({ points: 20 });
    expect(state.suggestions.find((suggestion) => suggestion.id === "s2")?.status).toBe("corrected");
    expect(state.selectedSuggestionId).toBe("s3");
    expect(state.mode).toBe("review");
  });

  it("keeps the corrected suggestion selected on apply fix when AUTO is off", () => {
    useAnnotationStore.setState({
      suggestions: [
        makeSuggestion("s1", "pending"),
        makeSuggestion("s2", "rejected"),
        makeSuggestion("s3", "pending"),
      ],
      selectedSuggestionId: "s2",
      mode: "edit",
    });
    useUIStore.setState({ autoAdvance: false });

    useAnnotationStore.getState().applyFix();

    const state = useAnnotationStore.getState();
    expect(state.suggestions.find((suggestion) => suggestion.id === "s2")?.status).toBe("corrected");
    expect(state.selectedSuggestionId).toBe("s2");
    expect(state.mode).toBe("review");
  });
});
