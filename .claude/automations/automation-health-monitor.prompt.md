작업명: GameLab health monitor + daily summary
스케줄: 매일 09:30 (Asia/Seoul)

목표:
1. 자동화 프롬프트/아티팩트/락 상태 점검
2. 스킬 SKILL.md 존재 + Read First 경로 유효성 점검
3. 문서 정합성 요약 (drift/managed_routes)
4. Slack webhook으로 통합 보고 전송

프로젝트 루트:
- PROJECT_ROOT

출력:
- docs/status/AUTOMATION-HEALTH.md
- docs/status/AUTOMATION-HEALTH-HISTORY.ndjson
- Slack webhook 전송 (SLACK_WEBHOOK_URL 환경변수)

---

## 자동화 레지스트리

```json
[
  {
    "name": "docs-nightly-organizer",
    "file": "docs-nightly-organizer.prompt.md",
    "task_id": "gamelab-docs-nightly-organizer",
    "schedule_kr": "매일 22:00 (Asia/Seoul)",
    "lock": "docs/.docs-nightly.lock",
    "freshness_hours": 26,
    "artifacts": ["docs/status/NIGHTLY-RUN-LOG.md"]
  },
  {
    "name": "code-doc-align",
    "file": "code-doc-align.prompt.md",
    "task_id": "gamelab-code-doc-align",
    "schedule_kr": "매일 21:30 (Asia/Seoul)",
    "lock": "docs/status/.code-doc-align.lock",
    "freshness_hours": 26,
    "artifacts": ["docs/status/INTEGRITY-REPORT.md", "docs/status/INTEGRITY-HISTORY.ndjson"]
  },
  {
    "name": "architecture-diagrams-sync",
    "file": "architecture-diagrams-sync.prompt.md",
    "task_id": "gamelab-architecture-diagrams-sync",
    "schedule_kr": "매일 04:00 (Asia/Seoul)",
    "lock": "docs/ref/.architecture-sync.lock",
    "freshness_hours": 26,
    "artifacts": ["docs/status/PROJECT-STATUS.md"]
  }
]
```

## 자동화 판정 기준

| 상태 | 조건 |
|------|------|
| HEALTHY | 프롬프트 존재 + 아티팩트 freshness_hours 이내 |
| RUNNING | 락 파일 존재, locked_at 기준 2시간 이내 |
| STALE | 아티팩트 freshness_hours 초과 |
| MISSING | 프롬프트 파일 자체 없음 |
| STUCK | 락 파일 존재, 2시간 초과 |
| FILE_MISSING | 아티팩트 파일 없음 |

---

## 스킬 레지스트리

```json
[
  {
    "name": "hotkey-sync",
    "file": ".claude/skills/gamelab-guide/core/hotkey-sync/SKILL.md",
    "check_files": [
      "frontend/src/lib/hooks/labeling/useLabelingHotkeys.ts",
      "frontend/src/components/layout/HotkeyHelp.tsx"
    ]
  },
  {
    "name": "be-fe-model-sync",
    "file": ".claude/skills/gamelab-guide/mirror/be-fe-model-sync/SKILL.md",
    "check_files": [
      "backend/app/models/schemas.py",
      "frontend/src/types/index.ts"
    ]
  },
  {
    "name": "i18n-string-add",
    "file": ".claude/skills/gamelab-guide/i18n/i18n-string-add/SKILL.md",
    "check_files": [
      "frontend/messages/ko.json",
      "frontend/messages/en.json"
    ]
  },
  {
    "name": "labeling-feature-add",
    "file": ".claude/skills/page-skills/feature/labeling-feature-add/SKILL.md",
    "check_files": [
      "frontend/src/app/(dashboard)/labeling/[id]/page.tsx"
    ]
  },
  {
    "name": "new-engine-register",
    "file": ".claude/skills/gamelab-guide/analysis/new-engine-register/SKILL.md",
    "check_files": [
      "backend/app/services/analysis/registry.py"
    ]
  },
  {
    "name": "pre-commit-validate",
    "file": ".claude/skills/gamelab-guide/ops/pre-commit-validate/SKILL.md",
    "check_files": [
      "scripts/check-utf8.mjs"
    ]
  },
  {
    "name": "new-domain-endpoint",
    "file": ".claude/skills/page-skills/page/new-domain-endpoint/SKILL.md",
    "check_files": [
      "backend/app/models/common.py",
      "frontend/src/lib/api/endpoints.ts"
    ]
  },
  {
    "name": "sprint-docs-sync",
    "file": ".claude/skills/meta/sprint-docs-sync/SKILL.md",
    "check_files": [
      "docs/status/PROJECT-STATUS.md",
      "docs/status/PAGE-UPGRADE-BOARD.md"
    ]
  }
]
```

## 스킬 판정 기준

| 상태 | 조건 |
|------|------|
| HEALTHY | SKILL.md 존재 + check_files 모두 존재 |
| FILE_MISSING | SKILL.md 또는 check_files 중 하나 이상 누락 |
| STALE | SKILL.md 내 Read First 경로 중 삭제된 파일 있음 |

---

## 문서 정합성 점검

입력:
- docs/status/INTEGRITY-REPORT.md
- docs/status/PAGE-UPGRADE-BOARD.md
- frontend/src/config/routes.ts

점검 항목:
1. managed_routes (routes.ts) == board_routes (PAGE-UPGRADE-BOARD.md) — drift 확인
2. INTEGRITY-REPORT.md 마지막 갱신 시각 freshness 확인
3. top_issues 추출 (최대 3건)

---

## Slack 보고

환경변수:
- SLACK_WEBHOOK_URL (필수)

payload schema:
```json
{
  "date_kst": "2026-03-04",
  "automation_summary": {
    "total": 3,
    "healthy": 3,
    "stale": 0,
    "stuck": 0,
    "missing": 0
  },
  "skill_summary": {
    "total": 8,
    "healthy": 8,
    "file_missing": 0,
    "stale": 0
  },
  "integrity_summary": {
    "drift": 0,
    "auto_fix": 0,
    "manual_required": 0
  },
  "board_summary": {
    "Ready": 2,
    "InProgress": 3,
    "QA": 2,
    "Done": 0,
    "Hold": 0
  },
  "top_issues": [],
  "report_links": [
    "docs/status/AUTOMATION-HEALTH.md",
    "docs/status/INTEGRITY-REPORT.md"
  ]
}
```

보안:
- webhook URL 출력 금지
- 민감값 마스킹

실패 처리:
- 재시도 2회
- 최종 실패 시 docs/status/NIGHTLY-RUN-LOG.md 및 docs/status/AUTOMATION-HEALTH.md에 failure 메모 추가

---

## 락 runbook

- RUNNING: locked_at 기준 2시간 이내
- STUCK: 2시간 초과
- 자동 해제 금지
- 수동 해제 시 released JSON으로 기록

---

## DRY_RUN

- DRY_RUN=true면 파일 수정 없이 콘솔 출력만 + Slack 전송 없이 payload 미리보기 출력
