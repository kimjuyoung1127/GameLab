export type LabelingMode = "review" | "edit";
export type DrawTool = "select" | "brush" | "eraser" | "box" | "anchor";

export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate?: number;
}
