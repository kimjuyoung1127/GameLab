# frontend/src/app/(dashboard)/labeling/[id] CLAUDE.md

## Role
- Orchestrator route for the labeling workspace.
- Composes `components/*`, connects `hooks/*`, and wires store/API flows.

## Source Of Truth
- State: `@/lib/store/*`
- Domain types: `@/types`
- API client: `@/lib/api/*`
- UI structure: local `components/*`
- Interaction logic: local `hooks/*`

## Do Not
1. Turn `page.tsx` back into a monolithic JSX file.
2. Put API calls or store mutations inside presentational components.
3. Duplicate coordinate/domain calculation logic across files.
4. Introduce `any` to bypass type safety.

## Edit Rules
- New UI blocks should be extracted into `components/` first.
- Pointer/drag/resize logic should live in `hooks/`.
- Keep i18n path aligned with `useTranslations("labeling")`.
- Minimum validation: `cd frontend && npm run lint && npm run build`.

## Current Layout Contract
- Left: file search/list/progress (`FileListPanel`)
- Center: toolbar + spectrogram + player (`ToolBar`, `SpectrogramPanel`, `PlayerControls`)
- Right: analysis + bookmarks + history (`AnalysisPanel`, `BookmarksPanel`, `ActionHistoryPanel`)