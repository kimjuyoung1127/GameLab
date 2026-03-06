# status/

Operational status board and automation artifacts.

## Core Files
- `PROJECT-STATUS.md`
- `PAGE-UPGRADE-BOARD.md`
- `SKILL-DOC-MATRIX.md`
- `INTEGRITY-REPORT.md`
- `AUTOMATION-HEALTH.md`
- `NIGHTLY-RUN-LOG.md`
- `AUTOMATION-SETUP.md`

## Stability Rule
- Keep file names stable for external automation.

## Subagent Consistency Rule
- During repo-wide consistency checks, treat these as a linked set:
  - `PROJECT-STATUS.md`
  - `PAGE-UPGRADE-BOARD.md`
  - `SKILL-DOC-MATRIX.md`
- If the check spans code + docs + local rules, run `subagent-doc-check` first.
