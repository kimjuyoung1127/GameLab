/** 구간 재생/내보내기: 원본/필터 구간 재생, WAV 다운로드. */
"use client";

import { useCallback, useState } from "react";
import { exportFilteredSelectionAsWav, downloadBlob } from "@/lib/audio/wav-export";
import type { ListeningSelection, FilterConfig } from "@/lib/audio/listening-types";

type UseLabelingSegmentPlaybackParams = {
  spectroListeningEnabled: boolean;
  listeningSelection: ListeningSelection | null;
  segmentIsPlaying: boolean;
  segmentMode: string | null;
  segmentStop: () => void;
  playOriginalSegment: (sel: ListeningSelection, rate: number) => Promise<void>;
  playFilteredSegment: (sel: ListeningSelection, opts: FilterConfig, rate: number) => Promise<void>;
  playbackRate: number;
  channelData: Float32Array | undefined;
  sampleRate: number | undefined;
  activeFilename: string;
  showToast: (msg: string) => void;
  t: (key: string, values?: Record<string, string>) => string;
};

export function useLabelingSegmentPlayback({
  spectroListeningEnabled,
  listeningSelection,
  segmentIsPlaying,
  segmentMode,
  segmentStop,
  playOriginalSegment,
  playFilteredSegment,
  playbackRate,
  channelData,
  sampleRate,
  activeFilename,
  showToast,
  t,
}: UseLabelingSegmentPlaybackParams) {
  const [segmentExportError, setSegmentExportError] = useState<string | null>(null);

  const handlePlayOriginalSelection = useCallback(() => {
    if (!spectroListeningEnabled || !listeningSelection) {
      showToast(t("listeningNoSelection"));
      return;
    }
    if (segmentIsPlaying && segmentMode === "original") {
      segmentStop();
      showToast(t("listeningOriginalStopped"));
      return;
    }
    void playOriginalSegment(listeningSelection, playbackRate);
  }, [listeningSelection, playbackRate, segmentIsPlaying, segmentMode, segmentStop, playOriginalSegment, showToast, spectroListeningEnabled, t]);

  const handlePlayFilteredSelection = useCallback(() => {
    if (!spectroListeningEnabled || !listeningSelection) {
      showToast(t("listeningNoFilterSelection"));
      return;
    }
    if (segmentIsPlaying && segmentMode === "filtered") {
      segmentStop();
      showToast(t("listeningFilteredStopped"));
      return;
    }
    void playFilteredSegment(
      listeningSelection,
      { order: 4, normalize: true, method: "biquad_chain" },
      playbackRate,
    );
  }, [listeningSelection, playbackRate, segmentIsPlaying, segmentMode, segmentStop, playFilteredSegment, showToast, spectroListeningEnabled, t]);

  const handleDownloadFilteredSelection = useCallback(async () => {
    if (!spectroListeningEnabled || !listeningSelection) {
      setSegmentExportError(t("listeningExportNoSelection"));
      showToast(t("listeningExportNoSelection"));
      return;
    }

    try {
      setSegmentExportError(null);
      const result = await exportFilteredSelectionAsWav({
        channelData,
        sampleRate,
        selection: listeningSelection,
        baseFilename: activeFilename,
        normalize: true,
      });
      downloadBlob(result.blob, result.filename);
      showToast(t("listeningExported", { filename: result.filename }));
    } catch (err) {
      const message = (err as Error).message || t("listeningExportFailed");
      setSegmentExportError(message);
      showToast(message);
    }
  }, [activeFilename, listeningSelection, showToast, spectroListeningEnabled, t, channelData, sampleRate]);

  return {
    segmentExportError,
    handlePlayOriginalSelection,
    handlePlayFilteredSelection,
    handleDownloadFilteredSelection,
  };
}
