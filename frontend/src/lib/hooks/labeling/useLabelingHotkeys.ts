/** Keyboard shortcut bindings for labeling workflow and media controls. */
"use client";

import { useEffect } from "react";
import type { AudioPlayerState } from "@/lib/hooks/use-audio-player";
import type { DrawTool, LabelingMode, ManualDraft, Suggestion } from "@/types";

type UseLabelingHotkeysParams = {
  mode: LabelingMode;
  setTool: (tool: DrawTool) => void;
  toggleSnap: () => void;
  handleConfirm: () => void;
  handleReject: () => void;
  handleApplyFix: () => void;
  handleNextFile: () => void;
  handlePrevFile: () => void;
  handleSaveManualDrafts: () => void;
  handleDeleteSelectedDraft: () => void;
  undo: () => void;
  redo: () => void;
  onSetLoopStart: () => void;
  onSetLoopEnd: () => void;
  onToggleLoop: () => void;
  onMarkNeedsAnalysis?: () => void;
  player: AudioPlayerState;
  suggestions: Suggestion[];
  manualDrafts: ManualDraft[];
  selectedDraftId: string | null;
  selectedSuggestionId: string | null;
  selectSuggestion: (id: string | null) => void;
  setZoomLevel: (updater: (value: number) => number) => void;
};

export function useLabelingHotkeys({
  mode,
  setTool,
  toggleSnap,
  handleConfirm,
  handleReject,
  handleApplyFix,
  handleNextFile,
  handlePrevFile,
  handleSaveManualDrafts,
  handleDeleteSelectedDraft,
  undo,
  redo,
  onSetLoopStart,
  onSetLoopEnd,
  onToggleLoop,
  onMarkNeedsAnalysis,
  player,
  suggestions,
  manualDrafts,
  selectedDraftId,
  selectedSuggestionId,
  selectSuggestion,
  setZoomLevel,
}: UseLabelingHotkeysParams) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNextFile();
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrevFile();
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          handleSaveManualDrafts();
          return;
        }
      }

      if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          player.setVolume(Math.min(player.volume + 0.1, 1));
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          player.setVolume(Math.max(player.volume - 0.1, 0));
          return;
        }
      }

      switch (e.key.toLowerCase()) {
        case "o":
          if (mode === "review") handleConfirm();
          break;
        case "x":
          if (mode === "review") handleReject();
          break;
        case "e":
          setTool("eraser");
          break;
        case "r":
          setTool("box");
          break;
        case "a":
          if (!e.ctrlKey && !e.metaKey) setTool("select");
          break;
        case "g":
          toggleSnap();
          break;
        case "f":
          if (mode === "edit") handleApplyFix();
          break;
        case "+":
        case "=":
          e.preventDefault();
          setZoomLevel((z) => Math.min(z + 0.25, 3.0));
          break;
        case "-":
          e.preventDefault();
          setZoomLevel((z) => Math.max(z - 0.25, 0.5));
          break;
        case "[":
          e.preventDefault();
          player.setPlaybackRate(Math.max(player.playbackRate - 0.25, 0.5));
          break;
        case "]":
          e.preventDefault();
          player.setPlaybackRate(Math.min(player.playbackRate + 0.25, 2.0));
          break;
        case "i":
          e.preventDefault();
          onSetLoopStart();
          break;
        case "p":
          e.preventDefault();
          onSetLoopEnd();
          break;
        case "l":
          e.preventDefault();
          onToggleLoop();
          break;
        case "m":
          e.preventDefault();
          onMarkNeedsAnalysis?.();
          break;
        case " ": {
          e.preventDefault();
          const sel = suggestions.find((s) => s.id === selectedSuggestionId);
          if (sel && !player.isPlaying) player.playRegion(sel.startTime, sel.endTime);
          else player.toggle();
          break;
        }
        case "tab": {
          e.preventDefault();
          const pendingSuggestions = suggestions.filter((s) => s.status === "pending");
          if (pendingSuggestions.length === 0) break;
          const idx = pendingSuggestions.findIndex((s) => s.id === selectedSuggestionId);
          const dir = e.shiftKey ? -1 : 1;
          const baseIdx = idx === -1 ? 0 : idx;
          const next = (baseIdx + dir + pendingSuggestions.length) % pendingSuggestions.length;
          selectSuggestion(pendingSuggestions[next]?.id ?? null);
          break;
        }
        case "delete":
        case "backspace":
          if (selectedDraftId) {
            e.preventDefault();
            handleDeleteSelectedDraft();
          }
          break;
        case "arrowdown": {
          e.preventDefault();
          if (suggestions.length === 0) break;
          const idx = suggestions.findIndex((s) => s.id === selectedSuggestionId);
          selectSuggestion(suggestions[Math.min(idx + 1, suggestions.length - 1)]?.id ?? null);
          break;
        }
        case "arrowup": {
          e.preventDefault();
          if (suggestions.length === 0) break;
          const idx = suggestions.findIndex((s) => s.id === selectedSuggestionId);
          selectSuggestion(suggestions[Math.max(idx - 1, 0)]?.id ?? null);
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    mode,
    setTool,
    toggleSnap,
    handleConfirm,
    handleReject,
    handleApplyFix,
    handleNextFile,
    handlePrevFile,
    handleSaveManualDrafts,
    handleDeleteSelectedDraft,
    undo,
    redo,
    onSetLoopStart,
    onSetLoopEnd,
    onToggleLoop,
    onMarkNeedsAnalysis,
    player,
    suggestions,
    manualDrafts,
    selectedDraftId,
    selectedSuggestionId,
    selectSuggestion,
    setZoomLevel,
  ]);
}
