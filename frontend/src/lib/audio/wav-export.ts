import type { ListeningSelection } from "@/lib/audio/listening-types";

type ExportFilteredSelectionParams = {
  channelData: Float32Array | null | undefined;
  sampleRate: number | null | undefined;
  selection: ListeningSelection;
  baseFilename: string;
  normalize?: boolean;
};

function sanitizeBaseFilename(name: string): string {
  const withoutExt = name.replace(/\.[^/.]+$/, "");
  return withoutExt.replace(/[^\w.-]+/g, "_");
}

function encodePcm16Wav(mono: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = mono.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < mono.length; i += 1) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    const pcm = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, pcm, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function normalizePeak(input: Float32Array): Float32Array {
  let peak = 0;
  for (let i = 0; i < input.length; i += 1) {
    const abs = Math.abs(input[i]);
    if (abs > peak) peak = abs;
  }
  if (peak <= 0 || peak >= 0.99) return input;

  const gain = 0.99 / peak;
  const scaled = new Float32Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    scaled[i] = input[i] * gain;
  }
  return scaled;
}

export function buildFilteredExportFilename(baseFilename: string, selection: ListeningSelection): string {
  const safeBase = sanitizeBaseFilename(baseFilename || "audio");
  const s = selection.timeStartSec.toFixed(2);
  const e = selection.timeEndSec.toFixed(2);
  const low = Math.round(selection.freqLowHz);
  const high = Math.round(selection.freqHighHz);
  return `${safeBase}_${s}s-${e}s_${low}Hz-${high}Hz.wav`;
}

export async function exportFilteredSelectionAsWav({
  channelData,
  sampleRate,
  selection,
  baseFilename,
  normalize = true,
}: ExportFilteredSelectionParams): Promise<{ blob: Blob; filename: string }> {
  if (!channelData || !sampleRate) {
    throw new Error("Audio data is not loaded");
  }
  if (selection.timeEndSec <= selection.timeStartSec) {
    throw new Error("Invalid selection time range");
  }
  if (selection.freqHighHz <= selection.freqLowHz || selection.freqLowHz < 0) {
    throw new Error("Invalid selection frequency range");
  }

  const start = Math.max(0, Math.floor(selection.timeStartSec * sampleRate));
  const end = Math.min(channelData.length, Math.ceil(selection.timeEndSec * sampleRate));
  if (end <= start) {
    throw new Error("Selected segment is empty");
  }

  const segment = channelData.slice(start, end);
  const offline = new OfflineAudioContext(1, segment.length, sampleRate);
  const buffer = offline.createBuffer(1, segment.length, sampleRate);
  buffer.copyToChannel(new Float32Array(segment), 0);

  const source = offline.createBufferSource();
  source.buffer = buffer;

  const highpass = offline.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = selection.freqLowHz;
  highpass.Q.value = 0.707;

  const lowpass = offline.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = selection.freqHighHz;
  lowpass.Q.value = 0.707;

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(offline.destination);
  source.start(0);

  const rendered = await offline.startRendering();
  const filteredData = rendered.getChannelData(0);
  const output = normalize ? normalizePeak(filteredData) : filteredData;
  const blob = encodePcm16Wav(output, sampleRate);
  const filename = buildFilteredExportFilename(baseFilename, selection);
  return { blob, filename };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
