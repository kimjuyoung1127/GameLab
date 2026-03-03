/** PNG 스크린샷 내보내기: 스펙트로그램 캔버스를 PNG 파일로 저장한다. */

import { downloadBlob } from "./wav-export";

/**
 * Captures the spectrogram container as a PNG image and triggers download.
 * Uses html2canvas-style manual canvas capture for the spectrogram canvas element.
 */
export function exportSpectrogramAsPng(
  spectrogramContainer: HTMLDivElement | null,
  filename: string,
): void {
  if (!spectrogramContainer) return;

  const canvas = spectrogramContainer.querySelector("canvas");
  if (!canvas) return;

  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, filename);
  }, "image/png");
}
