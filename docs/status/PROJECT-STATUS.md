# GameLab Project Status

Last Updated: 2026-03-03 (KST)
Owner Doc: `CLAUDE.md` (root slim index)

## Current Phase
- Phase 2D (deployment + labeling UX hardening)

## Spectrogram Listening Scope (Locked: 2026-03-03 KST)
- Workspace target: `frontend/src/app/(dashboard)/labeling/[id]` only
- MVP included:
  - selection-based original playback
  - selection-based filtered playback (band-pass)
  - filtered segment WAV download
  - selection info panel (time/frequency)
  - spectrogram hover metrics (time/frequency/estimated dB)
  - frequency axis toggle (linear/log display)
- Hotkey policy (conflict resolved):
  - `Space`: play/pause
  - `F`: filtered selection playback
  - `O`: original selection playback
  - review confirm is moved from `O` to `C`
  - apply-fix is moved from `F` to `Shift+F`
- Deferred out of scope:
  - pitch-preserving time-stretch
  - low-frequency pitch shift monitoring mode

## Automation Rollout Status
- docs structure migration: InProgress
- code-doc integrity pipeline: InProgress
- automation health monitor: Ready
- slack daily summary: Ready

## Next Actions
1. Implement spectrogram listening Phases 1-5 with feature flag default OFF.
2. Run frontend lint/build and manual playback regression checks.
3. Sync integrity docs and daily logs after rollout.
