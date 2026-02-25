/** 공용 타입: LabelingMode, DrawTool, WaveformData, SpectrogramData 정의. */
export type LabelingMode = "review" | "edit";
export type DrawTool = "select" | "brush" | "eraser" | "box" | "anchor";

export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate?: number;
  /** Raw mono channel data for FFT spectrogram computation */
  channelData?: Float32Array;
}

export interface SpectrogramData {
  /** RGBA pixel data for spectrogram heatmap */
  imageData: ImageData;
  /** Number of time frames (image width) */
  width: number;
  /** Number of frequency bins (image height) */
  height: number;
  /** Audio duration in seconds */
  duration: number;
  /** Nyquist frequency = sampleRate / 2 */
  maxFrequency: number;
  /** Source audio sample rate */
  sampleRate: number;
  /** Rendered frequency range lower bound in Hz (default: 0) */
  freqMin?: number;
  /** Rendered frequency range upper bound in Hz (default: maxFrequency) */
  freqMax?: number;
}
