# ai-context/

AI 협업 도구(Claude, Codex)를 위한 문서 허브. 프로젝트 맥락, 코딩 규칙, 스프린트 기록을 관리한다.

## 파일 구조

| 파일 | 역할 |
|------|------|
| `START-HERE.md` | 빠른 참조 인덱스 — 어떤 문서를 어떤 순서로 읽을지 안내 |
| `master-plan.md` | **Source of Truth** — 전체 로드맵, 스프린트 상태, 백로그, Phase 전환 기준 |
| `project-context.md` | 비즈니스 맥락 — 왜 만드는지, 대상 사용자, 도메인 모델, API 스펙 |
| `claude-coding-guideline.md` | Claude 전용 구현 규칙 — 시작 순서, 역할, 원칙, 완료 보고 형식 |
| `codex-review-guideline.md` | Codex 전용 리뷰 규칙 |
| `maintenance-analysis-pipeline.md` | 분석 파이프라인 유지보수 가이드 (V5.7 스텝, 디버깅, 파라미터 조정) |

## 하위 폴더

| 폴더 | 역할 |
|------|------|
| `logs/` | 세션별 작업 로그 (`YYYY-MM-DD-session-log.md`) |
| `archive/` | 완료된 스프린트 보고서, 핸드오프 문서 (날짜별 폴더로 보관) |

## 읽기 순서 (신규 세션 시작 시)

1. `master-plan.md` — 현재 상태 파악
2. `project-context.md` — 도메인 이해
3. `claude-coding-guideline.md` — 구현 규칙 확인
4. 최신 `archive/` 스프린트 보고서 — 직전 작업 내역

## 규칙

- 작업 중: `logs/` 세션 로그만 갱신
- 마감 시: `master-plan.md` 일괄 반영
- 완료된 문서는 `archive/{날짜}/`로 이동
- 경로는 항상 레포 루트 기준 상대경로
