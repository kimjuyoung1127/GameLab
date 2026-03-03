# GameLab Orchestration Index (Slim)

Smart Spectro-Tagging automation-first operating index.

## Repo Boundary
- Write Repo: `C:\Users\ezen601\Desktop\Jason\GameLab`

## Execution Rules (MUST)
1. Read target files before editing.
2. Reuse existing code first.
3. Keep BE/FE model and API mirror in sync.
4. Use `frontend/src/config/routes.ts` as managed route source of truth.
5. Keep `CLAUDE.md` files slim and move details to `docs/` or `ai-context/`.
6. No destructive git operations without explicit request.
7. At task end, sync daily log + board status + integrity notes.

## Automation Prompts (External Scheduler)
- `.claude/automations/docs-nightly-organizer.prompt.md` (22:00 KST)
- `.claude/automations/code-doc-align.prompt.md` (21:30 KST)
- `.claude/automations/automation-health-monitor.prompt.md` (09:30 KST)
- `.claude/automations/slack-daily-summary.prompt.md` (09:35 KST)
- `.claude/automations/architecture-diagrams-sync.prompt.md` (04:00 KST)

## Source of Truth Docs
- `ai-context/START-HERE.md`
- `ai-context/master-plan.md`
- `docs/status/PROJECT-STATUS.md`
- `docs/status/PAGE-UPGRADE-BOARD.md`
- `docs/status/SKILL-DOC-MATRIX.md`
- `docs/status/INTEGRITY-REPORT.md`
- `docs/status/AUTOMATION-HEALTH.md`
- `docs/ref/architecture-diagrams.md`
- `docs/ref/schema.md`

## Completion Format
- Scope
- Files
- Validation
- Daily Sync
- Risks
- Next Recommendations
