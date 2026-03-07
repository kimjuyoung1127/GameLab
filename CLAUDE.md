# GameLab Orchestration Index

Smart Spectro-Tagging — automation-first operating index.

## Repo Boundary
- Write Repo: `C:\Users\gmdqn\gamelab\GameLab`

## Context Loading Order (새 세션 시작 시)
1. **이 파일** — 전체 구조 + 규칙 + 스킬/자동화 인덱스
2. `ai-context/START-HERE.md` — 프로젝트 진입점
3. `ai-context/master-plan.md` — 현재 Phase/Sprint + 우선순위
4. `docs/status/PROJECT-STATUS.md` — 기능 상태 + 단축키 정책
5. 작업 대상 폴더의 `CLAUDE.md` — 해당 영역 규칙

## Execution Rules (MUST)
1. 파일 수정 전 반드시 현재 파일 내용을 직접 읽고 작업한다.
2. 기존 코드(타입/훅/함수/API)를 우선 재사용하고 중복 구현을 피한다.
3. BE/FE 모델과 API 미러를 1:1 동기화한다.
4. `frontend/src/config/routes.ts`가 라우트 진실 원본이다.
5. CLAUDE.md는 slim으로 유지하고 상세는 `docs/` 또는 `ai-context/`에 둔다.
6. 파괴적 git 조작은 명시적 요청 없이 금지한다.
7. 작업 종료 시 daily log + board status + integrity notes를 동기화한다.
8. 모든 신규 코드 파일 상단에 1~3줄 한국어 요약 주석을 둔다.

---

## Skills (`.claude/skills/`)

변경 시점에서 drift를 방지하는 8개 스킬. 상세: `.claude/skills/CLAUDE.md`

| # | 스킬 | 트리거 키워드 | 경로 |
|---|------|-------------|------|
| 1 | **hotkey-sync** | 단축키, hotkey, 핫키 | `gamelab-guide/core/hotkey-sync/` |
| 2 | **be-fe-model-sync** | 모델 동기화, type mirror | `gamelab-guide/mirror/be-fe-model-sync/` |
| 3 | **i18n-string-add** | 번역, i18n, 다국어 | `gamelab-guide/i18n/i18n-string-add/` |
| 4 | **labeling-feature-add** | 라벨링 기능, spectrogram | `page-skills/feature/labeling-feature-add/` |
| 5 | **new-engine-register** | 분석 엔진, new engine | `gamelab-guide/analysis/new-engine-register/` |
| 6 | **pre-commit-validate** | 커밋, pre-commit, 검증 | `gamelab-guide/ops/pre-commit-validate/` |
| 7 | **new-domain-endpoint** | 새 API, 도메인 추가 | `page-skills/page/new-domain-endpoint/` |
| 8 | **sprint-docs-sync** | 문서 동기화, sprint docs | `meta/sprint-docs-sync/` |

### 스킬 간 의존
- `labeling-feature-add` → `hotkey-sync` + `i18n-string-add`
- `new-domain-endpoint` → `be-fe-model-sync` + `pre-commit-validate`
- `pre-commit-validate` → `be-fe-model-sync` (검증만)

### 스킬 사용법
작업 키워드가 매칭되면 해당 `SKILL.md`의 **Read First** 파일들을 먼저 읽고, **Do** 절차를 순서대로 실행, **Validation** 체크리스트로 완료 확인.

---

## Automation Prompts (External Scheduler)

야간 drift 탐지 자동화. 스킬(preventive)과 상호 보완(detective).

| 자동화 | 스케줄 | 프롬프트 |
|--------|--------|----------|
| docs-nightly-organizer | 22:00 KST | `.claude/automations/docs-nightly-organizer.prompt.md` |
| code-doc-align | 21:30 KST | `.claude/automations/code-doc-align.prompt.md` |
| health-monitor + daily summary | 09:30 KST | `.claude/automations/automation-health-monitor.prompt.md` |
| architecture-diagrams-sync | 04:00 KST | `.claude/automations/architecture-diagrams-sync.prompt.md` |

---

## Source of Truth Docs
- `ai-context/START-HERE.md` — 프로젝트 진입점
- `ai-context/master-plan.md` — 마스터 플랜
- `ai-context/project-context.md` — 프로젝트 컨텍스트
- `ai-context/claude-coding-guideline.md` — 코딩 가이드라인
- `docs/status/PROJECT-STATUS.md` — 프로젝트 상태
- `docs/status/PAGE-UPGRADE-BOARD.md` — 라우트 상태 보드
- `docs/status/SKILL-DOC-MATRIX.md` — 스킬-코드-문서 매핑
- `docs/status/INTEGRITY-REPORT.md` — 정합성 보고서
- `docs/status/AUTOMATION-HEALTH.md` — 자동화 + 스킬 건강 상태
- `docs/ref/architecture-diagrams.md` — 아키텍처 다이어그램
- `docs/ref/schema.md` — DB 스키마

---

## Folder CLAUDE.md Map (주요)

### Backend
| 폴더 | 핵심 내용 |
|------|----------|
| `backend/` | FastAPI 프로젝트 구조 |
| `backend/app/` | 라우터 등록 순서, 전체 모듈 설명 |
| `backend/app/models/` | CamelModel 규칙, barrel(schemas.py) |
| `backend/app/api/` | 라우터 패턴, prefix 규칙 |
| `backend/app/services/analysis/` | 엔진 아키텍처, V5.7 baseline 보호 |
| `backend/tests/` | 테스트 규칙 |

### Frontend
| 폴더 | 핵심 내용 |
|------|----------|
| `frontend/` | Next.js 프로젝트 구조, 빌드/린트 |
| `frontend/src/app/(dashboard)/labeling/[id]/` | 라벨링 레이아웃 계약, 편집 규칙 |
| `frontend/src/app/(dashboard)/labeling/[id]/components/` | 컴포넌트 추출 규칙 |
| `frontend/src/lib/hooks/labeling/` | 훅 추출 규칙 |
| `frontend/src/lib/api/` | authFetch 패턴, endpoints barrel |
| `frontend/src/lib/store/` | Zustand 패턴 |
| `frontend/src/types/` | FE 타입 정의, barrel(index.ts) |
| `frontend/src/i18n/` | next-intl 쿠키 기반 |
| `frontend/src/components/layout/` | DashboardShell, HotkeyHelp |

### Docs & Context
| 폴더 | 핵심 내용 |
|------|----------|
| `docs/status/` | 상태 문서 5종 |
| `docs/ref/` | 아키텍처, 스키마 참조 |
| `ai-context/` | 마스터 플랜, 코딩 가이드 |
| `.claude/automations/` | 자동화 프롬프트 4개 |
| `.claude/skills/` | 스킬 8개 + 인덱스 |

---

## BE ↔ FE Mirror Structure
- `backend/app/models/{domain}.py` ↔ `frontend/src/types/{domain}.ts`
- `backend/app/api/{domain}/router.py` ↔ `frontend/src/lib/api/{domain}.ts`
- 도메인: upload, jobs, sessions, labeling, overview, leaderboard, common, achievement
- barrel: `schemas.py` / `index.ts` / `endpoints.ts`
- 변경 시 **be-fe-model-sync** 스킬 사용

## Test Policy (영역별 테스트 전략)

| 영역 | 테스트 수준 | 방법 | 이유 |
|------|-----------|------|------|
| BE 분석 엔진 (`services/analysis/`) | **TDD** | 실패 테스트 → 최소 구현 → 리팩터 | 입출력 명확, 버그 시 결과 오염 |
| BE API 엔드포인트 (`api/`) | **통합 테스트** | 요청/응답 계약 검증 | BE↔FE 불일치 방지 |
| FE 유틸/훅 (순수 로직) | **단위 테스트** | 상태 변환, 계산 로직 검증 | `action-queue`, `score-store` 등 |
| FE 컴포넌트/UI | **빌드 검증** | `npm run build` 통과 | 자주 바뀜, 테스트 유지비용 > 효과 |

### 테스트 규칙
1. BE 분석 엔진 변경 시 반드시 테스트 먼저 작성 (Red → Green → Refactor)
2. BE API 엔드포인트 추가/변경 시 통합 테스트 추가
3. 구조 변경(리팩터)과 동작 변경(기능)은 별도 커밋으로 분리
4. 모든 테스트 통과 전 커밋 금지 (`pre-commit-validate` 스킬 사용)
5. FE 컴포넌트는 TDD 대상 아님 — 빌드 + 수동 회귀 체크로 충분

## Quick Commands
- FE 빌드: `cd frontend && npm run build`
- BE 테스트: `cd backend && python -m pytest tests/ -v`
- 인코딩 검증: `node scripts/check-utf8.mjs`
- 커밋 전 검증: **pre-commit-validate** 스킬 사용

## Completion Format
- Scope / Files / Validation / Daily Sync / Risks / Next Recommendations

## Subagent Rules (Process Transplant)
- Use subagent-style exploration when work requires:
  - code vs docs/status vs local `CLAUDE.md` rule-chain comparison
  - reading three or more file groups before comparing or summarizing
  - collecting existing implementation patterns before adding a route, domain module, or data-contract change
- Keep split fixed when subagent exploration is used:
  - `SubA`: code facts
  - `SubB`: docs/status facts
  - `SubC`: local `CLAUDE.md` rule-chain facts
- Keep direct mutation in the main agent. Subagent-style work is only for discovery, comparison, and pattern collection.
- Skip subagent exploration for:
  - single-file edits
  - simple git operations
  - straightforward implementation that does not need repo-wide comparison
- Prefer dedicated ops skills:
  - `.claude/skills/gamelab-guide/ops/subagent-doc-check/SKILL.md`
  - `.claude/skills/gamelab-guide/ops/subagent-pattern-collect/SKILL.md`
- Reusable prompt patterns live in:
  - `memory/subagent-patterns.md`

## Automation Prompts (Process Transplant)
- `skill-doc-integrity`: `.claude/automations/skill-doc-integrity.prompt.md` (03:00 KST)
- `code-doc-align`: `.claude/automations/code-doc-align.prompt.md` (03:30 KST)
- `architecture-diagrams-sync`: `.claude/automations/architecture-diagrams-sync.prompt.md` (04:00 KST)
- `automation-health-monitor`: `.claude/automations/automation-health-monitor.prompt.md` (09:30 KST)
- `docs-nightly-organizer`: `.claude/automations/docs-nightly-organizer.prompt.md` (22:00 KST)

## Shared Skills
- Cross-client shared skills live under `skills/`.
- Shared skill index: `skills/CLAUDE.md`
- Use `skills/notebooklm-research/SKILL.md` when a task includes a NotebookLM URL, notebook-backed research, or source-grounded cross-checking before implementation.
