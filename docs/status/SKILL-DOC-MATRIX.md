# Skill Doc Matrix

Decision-complete mapping between page skills, code touch points, and required references.

| page_skill | target_route | primary_code_paths | required_docs | feature_skills | acceptance_checks |
|---|---|---|---|---|---|
| `page-login-upgrade` | `/login` | `frontend/src/app/(auth)/login/page.tsx` | `docs/status/PROJECT-STATUS.md` | `feature-form-validation-and-submit`, `feature-error-and-retry-state` | login flow, error handling |
| `page-overview-upgrade` | `/overview` | `frontend/src/app/(dashboard)/overview/page.tsx` | `docs/status/PROJECT-STATUS.md`, `docs/ref/architecture-diagrams.md` | `feature-data-binding-and-loading`, `feature-ui-empty-and-skeleton` | metric render and empty state |
| `page-upload-upgrade` | `/upload` | `frontend/src/app/(dashboard)/upload/page.tsx` | `docs/status/PROJECT-STATUS.md` | `feature-form-validation-and-submit`, `feature-error-and-retry-state` | upload and async progress |
| `page-sessions-upgrade` | `/sessions` | `frontend/src/app/(dashboard)/sessions/page.tsx` | `docs/status/PROJECT-STATUS.md` | `feature-data-binding-and-loading`, `feature-analytics-and-tracking` | list/filter and route transition |
| `page-leaderboard-upgrade` | `/leaderboard` | `frontend/src/app/(dashboard)/leaderboard/page.tsx` | `docs/status/PROJECT-STATUS.md` | `feature-ui-empty-and-skeleton`, `feature-data-binding-and-loading` | ranking and me-card parity |
| `page-profile-upgrade` | `/profile` | `frontend/src/app/(dashboard)/profile/page.tsx`, `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/config/routes.ts` | `docs/status/PROJECT-STATUS.md` | `feature-data-binding-and-loading`, `feature-ui-empty-and-skeleton` | profile route render + sidebar profile navigation |
| `page-labeling-upgrade` | `/labeling/[id]` | `frontend/src/app/(dashboard)/labeling/[id]/page.tsx`, `frontend/src/app/(dashboard)/labeling/[id]/components/SpectrogramPanel.tsx`, `frontend/src/lib/hooks/use-segment-playback.ts`, `frontend/src/lib/audio/wav-export.ts`, `frontend/src/lib/audio/spectrogram-export.ts`, `frontend/src/lib/hooks/use-spectrogram.ts` | `docs/status/PROJECT-STATUS.md`, `docs/ref/schema.md`, `docs/ref/architecture-diagrams.md` | `feature-navigation-and-gesture`, `feature-error-and-retry-state` | hotkeys/save/undo regression-free + selection playback/export + FFT settings/cursor sync/pitch preserve/0.25x speed/PNG export |

## Global Rules
- Route truth source: `frontend/src/config/routes.ts`
- Keep board route set equal to matrix route set.
- If required docs are missing, report as `manual_required`.

## Ops Skills

| ops_skill | purpose | sections | related_scope |
|---|---|---|---|
| `pre-commit-validate` | Validate build/test/encoding before commit. | `Trigger`, `Read First`, `Do`, `Validation` | commit gate |
| `subagent-doc-check` | Split consistency checks into code facts, docs facts, and rule-chain facts before comparing drift. | `Trigger`, `Read First`, `Procedure`, `Validation`, `Output` | repo-wide docs/status integrity |
| `subagent-pattern-collect` | Gather route/module/data-contract patterns before implementation. | `Trigger`, `Read First`, `Procedure`, `Validation`, `Output` | repo-wide implementation planning |
