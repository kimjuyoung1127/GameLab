# 03-03 Gamification V2 Implementation

## Scope
- Added DB migration SQL for mission/reward tables and suggestion reward columns
- Added backend gamification API (`/api/gamification/me`, `/api/gamification/missions`, claim endpoint)
- Added leaderboard scope support (`daily|weekly|all_time`)
- Added suggestion reward idempotency hook on labeling status patch
- Added frontend gamification types/api/store
- Removed Mission Center from labeling right panel (moved to profile-centric flow)
- Added overview mission snapshot widget and leaderboard scope tabs
- Replaced labeling header static `AR` badge with profile entry button (`/profile`)
- Added dashboard profile page (`/profile`) and connected sidebar user card click navigation

## Validation
- `python -m compileall backend/app`
- `npm --prefix frontend run lint -- src/lib/store/score-store.ts src/lib/store/mission-store.ts src/lib/api/gamification.ts src/lib/api/leaderboard.ts src/lib/api/endpoints.ts src/types/gamification.ts src/types/index.ts src/app/(dashboard)/labeling/[id]/page.tsx src/app/(dashboard)/labeling/[id]/components/AnalysisPanel.tsx src/app/(dashboard)/overview/page.tsx src/app/(dashboard)/leaderboard/page.tsx`
- `npm --prefix frontend run lint -- src/app/(dashboard)/profile/page.tsx src/config/routes.ts src/components/layout/Sidebar.tsx`

## Notes
- Supabase MCP migration apply failed due read-only mode in this session.
- SQL is saved at `scripts/sql-chunks/gamification_v2_core_tables.sql` for manual apply.
