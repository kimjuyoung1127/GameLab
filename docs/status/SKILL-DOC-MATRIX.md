# Skill Doc Matrix

Decision-complete mapping between page skills, code touch points, and required references.

| page_skill | target_route | primary_code_paths | required_docs | feature_skills | acceptance_checks |
|---|---|---|---|---|---|
| `page-login-upgrade` | `/login` | `frontend/src/app/(auth)/login/page.tsx` | `docs/status/PROJECT-STATUS.md` | `feature-form-validation-and-submit`, `feature-error-and-retry-state` | login flow, error handling |
| `page-overview-upgrade` | `/overview` | `frontend/src/app/(dashboard)/overview/page.tsx` | `docs/status/PROJECT-STATUS.md`, `docs/ref/architecture-diagrams.md` | `feature-data-binding-and-loading`, `feature-ui-empty-and-skeleton` | metric render and empty state |
| `page-upload-upgrade` | `/upload` | `frontend/src/app/(dashboard)/upload/page.tsx` | `docs/status/PROJECT-STATUS.md` | `feature-form-validation-and-submit`, `feature-error-and-retry-state` | upload and async progress |
| `page-sessions-upgrade` | `/sessions` | `frontend/src/app/(dashboard)/sessions/page.tsx` | `docs/status/PROJECT-STATUS.md` | `feature-data-binding-and-loading`, `feature-analytics-and-tracking` | list/filter and route transition |
| `page-leaderboard-upgrade` | `/leaderboard` | `frontend/src/app/(dashboard)/leaderboard/page.tsx` | `docs/status/PROJECT-STATUS.md` | `feature-ui-empty-and-skeleton`, `feature-data-binding-and-loading` | ranking and me-card parity |
| `page-labeling-upgrade` | `/labeling/[id]` | `frontend/src/app/(dashboard)/labeling/[id]/page.tsx` | `docs/status/PROJECT-STATUS.md`, `docs/ref/schema.md` | `feature-navigation-and-gesture`, `feature-error-and-retry-state` | hotkeys/save/undo regression-free |

## Global Rules
- Route truth source: `frontend/src/config/routes.ts`
- Keep board route set equal to matrix route set.
- If required docs are missing, report as `manual_required`.
