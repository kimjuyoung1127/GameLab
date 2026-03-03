# GameLab Project Status

Last Updated: 2026-03-03 (KST)
Owner Doc: `CLAUDE.md` (root slim index)

## Current Phase
- Phase 2E (spectrogram listening MVP integrated)
- Baseline pinned to commit `fa76c00` (2026-03-03 KST rollback sync)
- Gamification V2 implementation in progress (mission/reward DB-backed flow)

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
1. Apply `scripts/sql-chunks/gamification_v2_core_tables.sql` to Supabase project.
2. QA pass for gamification endpoints (`/api/gamification/*`) and leaderboard scope tabs.
3. Validate mission claim/idempotency with real suggestion lifecycle data.

## Recent QA Hotfixes (2026-03-03 KST)
- segment playback mode visibility and stop/toggle control
- numeric selection input delete/retype stabilization
- numeric selection input commit timing fix (Enter/blur)
- label UX experimental branch commits rolled back; status/docs aligned to baseline `fa76c00`
