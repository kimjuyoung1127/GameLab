# frontend/src/app/(dashboard)/labeling CLAUDE.md

## Role
- Top-level namespace guide for labeling routes.
- All real implementation belongs under `[id]/`.

## Directory Policy
- `labeling/[id]/page.tsx`: orchestration entry point only.
- `labeling/[id]/components/*`: presentation and layout components.
- `labeling/[id]/hooks/*`: route-local interaction logic.
- `labeling/[id]/styles/*`: route-scoped CSS modules only when needed.

## Do Not
1. Duplicate `[id]` feature logic in `labeling/` root.
2. Move interaction logic back into presentational components.
3. Add ad-hoc rules that conflict with `[id]/CLAUDE.md`.

## Change Workflow
1. Read `[id]/CLAUDE.md` first.
2. Apply changes in small `components` / `hooks` units.
3. Validate with `cd frontend && npm run lint && npm run build`.

## Quality Bar
- Keep single responsibility per file.
- Preserve import flow: `page -> components/hooks`.
- For big changes, leave regression checklist notes (hotkeys, drag/resize, save, file navigation).