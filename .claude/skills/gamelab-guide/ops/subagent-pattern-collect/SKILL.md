---
name: subagent-pattern-collect
description: Collect GameLab implementation patterns through subagent-style exploration before adding routes, domain modules, or data-contract changes.
---

# subagent-pattern-collect

## Trigger
- "새 route 만들기 전에 패턴 수집"
- "기존 구조부터 찾아줘"
- "schema/type/doc 계약 패턴 모아줘"
- "어디를 따라야 하는지 먼저 확인"

## Read First
1. `CLAUDE.md`
2. `frontend/CLAUDE.md`
3. `frontend/src/components/features/CLAUDE.md`
4. `frontend/src/components/domain/CLAUDE.md`

## Procedure

### 1. Choose one mode
- `route-page`
  - Read `frontend/src/app/**/page.tsx`
  - Read related modules in `frontend/src/components/domain/**` and `frontend/src/components/layout/**`
  - Read related hooks in `frontend/src/lib/hooks/**`
  - Read route docs in `docs/status/PAGE-UPGRADE-BOARD.md` and `docs/status/PROJECT-STATUS.md`
- `feature-module`
  - Read `frontend/src/components/domain/<feature>`
  - Read `frontend/src/lib/hooks/**`
  - Read `frontend/src/lib/api/**`
  - Read matching tests if present
- `data-contract`
  - Read `backend/app/models/**`
  - Read `frontend/src/types/**`
  - Read `scripts/sql-chunks/**`
  - Read `docs/ref/schema.md`
  - Read `docs/status/PROJECT-STATUS.md`

### 2. Collect patterns
- Capture file grouping and ownership boundaries.
- Capture data flow and hook usage patterns.
- Capture validation or acceptance expectations from docs.
- Capture reusable snippets or switch points with file references.

### 3. Summarize for implementation
- Produce a checklist of files to follow.
- Produce 2-5 representative file references.
- Note cautions such as board/status sync, required docs updates, or required tests.
- Stop at pattern collection. Do not implement in this step.

## Validation
- The chosen mode is explicit.
- The scan covers code plus at least one matching doc source.
- The output includes file references, cautions, and a concise implementation pattern summary.

## Output
```markdown
## Pattern Collection Result
### Mode
- route-page | feature-module | data-contract

### Checklist
- [ ] file or pattern 1
- [ ] file or pattern 2

### Representative Files
- `path/to/file`: why it matters

### Cautions
- board/status sync / schema contract / tests

### Reusable Pattern Summary
- short implementation guidance ready to follow
```
