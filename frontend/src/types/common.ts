/** 공용 타입: LabelingMode, DrawTool, WaveformData 정의. */
export type LabelingMode = "review" | "edit";
export type DrawTool = "select" | "brush" | "eraser" | "box" | "anchor";

export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate?: number;
}
