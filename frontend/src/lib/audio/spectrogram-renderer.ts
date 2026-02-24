/** 스펙트로그램 렌더러: Radix-2 FFT + STFT → ImageData 변환. 외부 의존성 없음. */

import { dbToColor } from "./color-maps";

export interface SpectrogramOptions {
  fftSize: number;
  hopSize: number;
  windowFn: "hann" | "hamming" | "blackman";
  minDb: number;
  maxDb: number;
  sampleRate: number;
  /** 최대 프레임 수 (대용량 보호) */
  maxFrames: number;
}

export const DEFAULT_OPTIONS: Omit<SpectrogramOptions, "sampleRate"> = {
  fftSize: 2048,
  hopSize: 512,
  windowFn: "hann",
  minDb: -90,
  maxDb: -10,
  maxFrames: 10000,
};

/* ────────── Window functions ────────── */

function hannWindow(n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  }
  return w;
}

function hammingWindow(n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    w[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1));
  }
  return w;
}

function blackmanWindow(n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / (n - 1);
    w[i] = 0.42 - 0.5 * Math.cos(t) + 0.08 * Math.cos(2 * t);
  }
  return w;
}

function getWindow(fn: SpectrogramOptions["windowFn"], n: number): Float64Array {
  switch (fn) {
    case "hamming": return hammingWindow(n);
    case "blackman": return blackmanWindow(n);
    default: return hannWindow(n);
  }
}

/* ────────── Radix-2 FFT (in-place) ────────── */

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      let tmp = re[i]; re[i] = re[j]; re[j] = tmp;
      tmp = im[i]; im[i] = im[j]; im[j] = tmp;
    }
  }

  // Cooley-Tukey butterfly
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = -2 * Math.PI / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let tRe = 1;
      let tIm = 0;
      for (let j = 0; j < half; j++) {
        const a = i + j;
        const b = a + half;
        const uRe = re[a], uIm = im[a];
        const vRe = re[b] * tRe - im[b] * tIm;
        const vIm = re[b] * tIm + im[b] * tRe;
        re[a] = uRe + vRe;
        im[a] = uIm + vIm;
        re[b] = uRe - vRe;
        im[b] = uIm - vIm;
        const nextRe = tRe * wRe - tIm * wIm;
        tIm = tRe * wIm + tIm * wRe;
        tRe = nextRe;
      }
    }
  }
}

/* ────────── STFT → ImageData ────────── */

/**
 * 오디오 채널 데이터로부터 스펙트로그램 ImageData를 생성한다.
 * @returns { imageData, width, height } — width=time frames, height=fftSize/2
 */
export function computeSpectrogram(
  channelData: Float32Array,
  options: SpectrogramOptions,
): { imageData: Uint8ClampedArray; width: number; height: number } {
  const { fftSize, hopSize, windowFn, minDb, maxDb, maxFrames } = options;
  const freqBins = fftSize >> 1; // fftSize / 2

  // Calculate number of frames
  let numFrames = Math.floor((channelData.length - fftSize) / hopSize) + 1;
  if (numFrames < 1) numFrames = 1;

  // Downsample if too many frames
  let effectiveHop = hopSize;
  if (numFrames > maxFrames) {
    effectiveHop = Math.floor((channelData.length - fftSize) / (maxFrames - 1));
    numFrames = maxFrames;
  }

  const window = getWindow(windowFn, fftSize);
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);

  // Output: RGBA for each pixel (width=numFrames, height=freqBins)
  const pixels = new Uint8ClampedArray(numFrames * freqBins * 4);

  for (let frame = 0; frame < numFrames; frame++) {
    const offset = frame * effectiveHop;

    // Apply window + copy to FFT buffer
    for (let i = 0; i < fftSize; i++) {
      const sampleIdx = offset + i;
      re[i] = sampleIdx < channelData.length ? channelData[sampleIdx] * window[i] : 0;
      im[i] = 0;
    }

    fft(re, im);

    // Convert to dB magnitude and map to color
    for (let bin = 0; bin < freqBins; bin++) {
      const mag = Math.sqrt(re[bin] * re[bin] + im[bin] * im[bin]);
      const db = mag > 0 ? 20 * Math.log10(mag) : minDb;
      const color = dbToColor(db, minDb, maxDb);

      // Y-axis: row 0 = highest frequency, row (freqBins-1) = lowest frequency
      const row = freqBins - 1 - bin;
      const pixelIdx = (row * numFrames + frame) * 4;
      pixels[pixelIdx] = color[0];
      pixels[pixelIdx + 1] = color[1];
      pixels[pixelIdx + 2] = color[2];
      pixels[pixelIdx + 3] = color[3];
    }
  }

  return { imageData: pixels, width: numFrames, height: freqBins };
}
