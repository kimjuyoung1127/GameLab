---
name: subagent-doc-check
description: Subagent-style consistency check for GameLab code facts, docs/status facts, and local CLAUDE.md rule chains before deciding what to update.
---

# subagent-doc-check

## Trigger
- "문서 정합성 체크"
- "code-doc drift 점검"
- "status sync 전에 전체 비교"
- "코드, 문서, CLAUDE 규칙을 같이 맞춰야 함"

## Read First
1. `CLAUDE.md`
2. `docs/status/CLAUDE.md`
3. `frontend/CLAUDE.md`

## Procedure

### 1. Run fixed discovery lanes
- `SubA - code facts`
  - `frontend/src/app/**/page.tsx`
  - `frontend/src/app/**/route.ts`
  - `frontend/src/components/domain/**`
  - `frontend/src/components/layout/**`
  - `frontend/src/lib/hooks/**`
  - `frontend/src/lib/api/**`
  - `frontend/src/types/**`
  - `backend/app/models/**`
  - `scripts/sql-chunks/**`
- `SubB - docs facts`
  - `docs/status/PROJECT-STATUS.md`
  - `docs/status/PAGE-UPGRADE-BOARD.md`
  - `docs/status/SKILL-DOC-MATRIX.md`
  - `docs/status/INTEGRITY-REPORT.md`
  - `docs/ref/schema.md`
  - `docs/ref/architecture-diagrams.md`
- `SubC - local rule chain`
  - `CLAUDE.md`
  - `docs/CLAUDE.md`
  - `docs/status/CLAUDE.md`
  - `frontend/CLAUDE.md`
  - `frontend/src/components/features/CLAUDE.md`
  - `frontend/src/components/domain/CLAUDE.md`
  - `frontend/src/components/domain/*/CLAUDE.md`
  - `backend/CLAUDE.md`

### 2. Normalize facts
- Build route lists, domain component/module lists, skill/doc references, and schema references.
- Extract only facts and claims. Do not propose edits during discovery.

### 3. Compare
- `SubA vs SubB`: code-to-doc drift
- `SubA vs SubC`: code-to-rule drift
- `SubB vs SubC`: doc-to-rule drift
- Keep the main agent focused on classification:
  - missing docs coverage
  - stale status claims
  - stale local guidance
  - broken referenced paths

### 4. Fix policy
- Prefer updating docs and local guidance to match actual code when code is the source of truth.
- If code appears behind documented plan, report the gap explicitly before editing.
- Do not delegate direct code mutation. The main agent performs final edits.

## Validation
- Three fact lanes were collected before comparison.
- The report names each drift item and the source files involved.
- No stale source-project paths remain in findings.

## Output
```markdown
## Consistency Check Result
- Code facts: routes N, api routes N, domain modules N, schema artifacts N
- Docs facts: status docs N, matrix refs N
- Rule-chain facts: CLAUDE guides N
- Drift:
  - Code vs Docs: X
  - Code vs Rules: Y
  - Docs vs Rules: Z
- Recommended edit surface:
  - docs only / rules only / code+docs follow-up
```
