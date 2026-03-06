# .claude/skills/

GameLab skill assets for Claude Code interactive development.

## Structure
- `gamelab-guide/` — 도메인 지식 기반 스킬 (hotkey, mirror, i18n, engine, ops)
- `page-skills/` — 라우트/기능 수준 스킬 (labeling feature, domain endpoint)
- `meta/` — 문서 오케스트레이션 스킬 (sprint docs sync)

## Skill Format
- 모든 스킬은 `SKILL.md` (YAML front matter + 7 섹션)
- front matter: `name:`, `description:` (트리거 키워드 포함)
- 섹션: Trigger, Input Context, Read First, Do, Do Not, Validation, Output Template

## Cross-Skill Invocation
- `labeling-feature-add` → `hotkey-sync` + `i18n-string-add`
- `new-domain-endpoint` → `be-fe-model-sync` + `pre-commit-validate`
- `pre-commit-validate` → `be-fe-model-sync` (검증만)

## Automation Relationship
- Skills = 변경 시점에서 drift 방지 (preventive)
- Automations = 야간 drift 탐지 (detective)
- 상호 보완적 구조

## Subagent Ops Skills
- `subagent-doc-check`
  - Path: `gamelab-guide/ops/subagent-doc-check/`
  - Use for three-lane consistency checks across code, docs/status, and local rule chains.
- `subagent-pattern-collect`
  - Path: `gamelab-guide/ops/subagent-pattern-collect/`
  - Use for route/module/data-contract pattern collection before implementation.

## Subagent Split Contract
- `SubA`: code facts
- `SubB`: docs/status facts
- `SubC`: local `CLAUDE.md` rule-chain facts
- Subagent-style work is discovery only; direct edits stay in the main agent.
