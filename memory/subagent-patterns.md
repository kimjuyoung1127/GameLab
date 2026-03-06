# Subagent Patterns

Reusable decision rules for subagent-style exploration in GameLab.

## Decision Tree
1. Is the task a single-file edit, a small code tweak, or a simple Git action?
   - Yes -> do not use subagent exploration.
   - No -> continue.
2. Does the task require comparing code, docs/status, and local `CLAUDE.md` guidance?
   - Yes -> use `subagent-doc-check`.
   - No -> continue.
3. Does the task require finding existing implementation patterns before building?
   - Yes -> use `subagent-pattern-collect`.
   - No -> continue.
4. Does the task span three or more file groups and end in comparison or summarization?
   - Yes -> use the fixed split `SubA/SubB/SubC`.
   - No -> keep the work in the main agent.

## Fixed File Groups
### SubA - Code Facts
- `frontend/src/app/**/page.tsx`
- `frontend/src/app/**/route.ts`
- `frontend/src/components/domain/**`
- `frontend/src/components/layout/**`
- `frontend/src/lib/hooks/**`
- `frontend/src/lib/api/**`
- `frontend/src/types/**`
- `backend/app/models/**`
- `scripts/sql-chunks/**`

### SubB - Docs and Status Facts
- `docs/status/PROJECT-STATUS.md`
- `docs/status/PAGE-UPGRADE-BOARD.md`
- `docs/status/SKILL-DOC-MATRIX.md`
- `docs/status/INTEGRITY-REPORT.md`
- `docs/ref/schema.md`
- `docs/ref/architecture-diagrams.md`

### SubC - Local Rule Chain
- `CLAUDE.md`
- `docs/CLAUDE.md`
- `docs/status/CLAUDE.md`
- `frontend/CLAUDE.md`
- `frontend/src/components/features/CLAUDE.md`
- `frontend/src/components/domain/CLAUDE.md`
- `frontend/src/components/domain/*/CLAUDE.md`
- `backend/CLAUDE.md`

## Prompt Examples
### Consistency Check
```text
Run subagent-doc-check.
SubA: collect actual route, module, hook, API, and schema facts.
SubB: collect board, matrix, project-status, and architecture/schema doc facts.
SubC: collect root/docs/frontend/backend CLAUDE guidance.
Return only drift items and recommended edit surfaces.
```

### Route Pattern Collection
```text
Run subagent-pattern-collect in route-page mode.
Target route: /overview
Collect closest existing page, domain module, hook, and doc patterns.
Return checklist, representative files, cautions, and reusable summary.
```

### Data Contract Pattern Collection
```text
Run subagent-pattern-collect in data-contract mode.
Collect model, SQL chunk, types, and schema/status expectations.
Return contract patterns and cautions before implementation.
```

## Skip Cases
- One-file refactors
- Small bug fixes with already-known target files
- Simple status doc updates
- Plain Git inspection or branch work
- Straightforward implementation where the existing pattern is already obvious
