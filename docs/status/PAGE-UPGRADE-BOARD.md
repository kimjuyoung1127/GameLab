# Page Upgrade Board

Source of truth for route-level execution status.

| route | label | group | priority | status | owner | page_skill | support_skills | must_read_docs | last_updated |
|---|---|---|---|---|---|---|---|---|---|
| `/login` | Login | Auth | P1 | Ready | unassigned | `page-login-upgrade` | `feature-form-validation-and-submit`, `feature-error-and-retry-state` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/overview` | Overview | Dashboard | P0 | InProgress | unassigned | `page-overview-upgrade` | `feature-data-binding-and-loading`, `feature-ui-empty-and-skeleton` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/upload` | Upload | Dashboard | P0 | InProgress | unassigned | `page-upload-upgrade` | `feature-form-validation-and-submit`, `feature-error-and-retry-state` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/sessions` | Sessions | Dashboard | P0 | InProgress | unassigned | `page-sessions-upgrade` | `feature-data-binding-and-loading`, `feature-analytics-and-tracking` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/leaderboard` | Leaderboard | Dashboard | P1 | Ready | unassigned | `page-leaderboard-upgrade` | `feature-ui-empty-and-skeleton`, `feature-data-binding-and-loading` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/profile` | Profile | Dashboard | P1 | QA | unassigned | `page-profile-upgrade` | `feature-data-binding-and-loading`, `feature-ui-empty-and-skeleton` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/labeling/[id]` | Labeling Workspace | Labeling | P0 | QA | unassigned | `page-labeling-upgrade` | `feature-navigation-and-gesture`, `feature-error-and-retry-state` | `docs/status/PROJECT-STATUS.md`, `docs/ref/architecture-diagrams.md` | 2026-03-03 |

## Status Flow

`Ready -> InProgress -> QA -> Done` (`Hold` for blocked work).

## Locked Decisions (Spectrogram Listening)
- Target route: `/labeling/[id]`
- Feature flag: `NEXT_PUBLIC_ENABLE_SPECTRO_LISTENING_V1` (default OFF)
- Hotkeys:
  - playback: `Space`
  - original selection playback: `O`
  - filtered selection playback: `F`
  - confirm suggestion: `C` (moved from `O`)
  - apply fix: `Shift+F` (moved from `F`)
- Deferred:
  - pitch-preserving playback
  - pitch-shift listening assist
