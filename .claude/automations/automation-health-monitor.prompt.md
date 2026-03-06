# automation-health-monitor - automation and skill health summary

## Meta
- Task: GameLab health monitor + daily summary
- Schedule: Daily 09:30 (Asia/Seoul)
- Role: Detect missing/stale automation artifacts and skill references
- Project root: `C:\Users\gmdqn\gamelab\GameLab`

## Output
- `docs/status/AUTOMATION-HEALTH.md`
- `docs/status/AUTOMATION-HEALTH-HISTORY.ndjson`

## Automation Registry
```json
[
  {
    "name": "skill-doc-integrity",
    "file": ".claude/automations/skill-doc-integrity.prompt.md",
    "lock": "docs/status/.skill-doc-integrity.lock",
    "freshness_hours": 26,
    "artifacts": ["docs/status/SKILL-DOC-INTEGRITY-REPORT.md"]
  },
  {
    "name": "code-doc-align",
    "file": ".claude/automations/code-doc-align.prompt.md",
    "lock": "docs/status/.code-doc-align.lock",
    "freshness_hours": 26,
    "artifacts": ["docs/status/INTEGRITY-REPORT.md", "docs/status/INTEGRITY-HISTORY.ndjson"]
  },
  {
    "name": "architecture-diagrams-sync",
    "file": ".claude/automations/architecture-diagrams-sync.prompt.md",
    "lock": "docs/ref/.architecture-sync.lock",
    "freshness_hours": 26,
    "artifacts": ["docs/status/PROJECT-STATUS.md"]
  },
  {
    "name": "docs-nightly-organizer",
    "file": ".claude/automations/docs-nightly-organizer.prompt.md",
    "lock": "docs/.docs-nightly.lock",
    "freshness_hours": 26,
    "artifacts": ["docs/status/NIGHTLY-RUN-LOG.md"]
  }
]
```

## Skill Registry
```json
[
  { "name": "hotkey-sync", "file": ".claude/skills/gamelab-guide/core/hotkey-sync/SKILL.md" },
  { "name": "be-fe-model-sync", "file": ".claude/skills/gamelab-guide/mirror/be-fe-model-sync/SKILL.md" },
  { "name": "i18n-string-add", "file": ".claude/skills/gamelab-guide/i18n/i18n-string-add/SKILL.md" },
  { "name": "labeling-feature-add", "file": ".claude/skills/page-skills/feature/labeling-feature-add/SKILL.md" },
  { "name": "new-engine-register", "file": ".claude/skills/gamelab-guide/analysis/new-engine-register/SKILL.md" },
  { "name": "pre-commit-validate", "file": ".claude/skills/gamelab-guide/ops/pre-commit-validate/SKILL.md" },
  { "name": "subagent-doc-check", "file": ".claude/skills/gamelab-guide/ops/subagent-doc-check/SKILL.md" },
  { "name": "subagent-pattern-collect", "file": ".claude/skills/gamelab-guide/ops/subagent-pattern-collect/SKILL.md" },
  { "name": "new-domain-endpoint", "file": ".claude/skills/page-skills/page/new-domain-endpoint/SKILL.md" },
  { "name": "sprint-docs-sync", "file": ".claude/skills/meta/sprint-docs-sync/SKILL.md" }
]
```

## Rules
- `HEALTHY`: prompt/skill file exists and key artifacts are fresh.
- `FILE_MISSING`: expected prompt/skill/artifact file missing.
- `STALE`: artifact exists but freshness threshold exceeded.
- `RUNNING`: lock exists and started less than 2 hours ago.
- `STUCK`: lock exists and started 2 hours or more ago.
- Never auto-release locks; only report.

## DRY_RUN
- If `DRY_RUN=true`, print report preview only and do not write files.
