# frontend/src/components/features CLAUDE.md

Compatibility guide for imported subagent process.

## Mapping Rule
- This repository uses `frontend/src/components/domain/*` as the feature-module equivalent.
- If an imported workflow references `frontend/src/components/features/*`, map it to:
  - `frontend/src/components/domain/*`
  - `frontend/src/components/layout/*` when route shell/presentation is involved.

## Required Practice
- Run `subagent-pattern-collect` before creating or expanding a domain module.
- Keep data access in hooks/api libs; keep component folders presentation-focused.
