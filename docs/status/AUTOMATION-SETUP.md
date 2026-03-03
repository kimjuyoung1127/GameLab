# Automation Setup (External Scheduler)

This project uses prompt-based external automation.

## Prompt Paths
1. `.claude/automations/docs-nightly-organizer.prompt.md` (22:00 KST)
2. `.claude/automations/code-doc-align.prompt.md` (21:30 KST)
3. `.claude/automations/automation-health-monitor.prompt.md` (09:30 KST)
4. `.claude/automations/slack-daily-summary.prompt.md` (09:35 KST)
5. `.claude/automations/architecture-diagrams-sync.prompt.md` (04:00 KST)

## Registration Guide
- Copy each prompt body as-is into the external scheduler task.
- Set timezone to `Asia/Seoul`.
- First run with `DRY_RUN=true`.
- Second run with `DRY_RUN=false`.

## Required Env
- `PROJECT_ROOT` (absolute path to GameLab)
- `SLACK_WEBHOOK_URL` (for slack-daily-summary only)

## First Real-Run Acceptance
- Critical errors: 0
- Integrity drift: 0
- Status docs updated without lock-stuck
