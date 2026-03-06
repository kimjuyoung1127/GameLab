# automations/

GameLab automation prompt index for deterministic documentation and status maintenance.

## Principles
- Keep every automation deterministic and idempotent.
- State exact source-of-truth files before comparing or reporting.
- Use lock files to avoid duplicate runs.
- Do not edit `frontend/src/` from automation prompts unless explicitly requested.
- Default to `DRY_RUN=true` and require deliberate promotion to write mode.

## Prompt Files
| File | Purpose | Schedule |
|---|---|---|
| `skill-doc-integrity.prompt.md` | Check skill inventory, matrix coverage, and skill file integrity. | Daily 03:00 KST |
| `code-doc-align.prompt.md` | Check route/code/docs alignment and route evidence drift. | Daily 03:30 KST |
| `architecture-diagrams-sync.prompt.md` | Check architecture doc coverage and mismatches. | Daily 04:00 KST |
| `automation-health-monitor.prompt.md` | Summarize automation run health and lock status. | Daily 09:30 KST |
| `docs-nightly-organizer.prompt.md` | Organize daily logs into stable docs structure. | Daily 22:00 KST |

## Subagent-Aware Flow
- `skill-doc-integrity.prompt.md` verifies that subagent skills are registered and structurally complete.
- `code-doc-align.prompt.md` may delegate discovery to `subagent-doc-check` when drift analysis spans code, docs, and local `CLAUDE.md` chains.
- Automations only call subagent-style exploration for comparison and summarization, never for direct code edits.

## Execution Order
```text
03:00 skill-doc-integrity
03:30 code-doc-align
04:00 architecture-diagrams-sync
09:30 automation-health-monitor
22:00 docs-nightly-organizer
```
