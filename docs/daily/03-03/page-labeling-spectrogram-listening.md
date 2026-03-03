# 03-03 Labeling Spectrogram Listening Rollout

## Route
- `/labeling/[id]`

## Completed
- [x] selection original playback (`O`)
- [x] selection filtered playback (`F`)
- [x] review confirm key moved to `C`
- [x] apply-fix key moved to `Shift+F`
- [x] filtered segment WAV export
- [x] selection numeric input panel
- [x] frequency axis display toggle (LIN/LOG)
- [x] spectrogram hover metrics (time/frequency/estimated dB)

## Validation
- [x] `npm --prefix frontend run lint -- src/lib/hooks/labeling/useLabelingHotkeys.ts src/app/(dashboard)/labeling/[id]/page.tsx src/app/(dashboard)/labeling/[id]/components/SpectrogramPanel.tsx src/app/(dashboard)/labeling/[id]/components/AnalysisPanel.tsx src/components/layout/HotkeyHelp.tsx`
- [x] `npm --prefix frontend run lint -- src/lib/audio/wav-export.ts src/lib/hooks/use-segment-playback.ts`

## Notes
- Feature flag remains OFF by default:
  - `NEXT_PUBLIC_ENABLE_SPECTRO_LISTENING_V1=false`
- Deferred:
  - pitch-preserving playback
  - low-frequency pitch-shift listening mode
