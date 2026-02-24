# GameLab Master Plan

기준일: 2026-02-24 (KST)
프로젝트: Smart Spectro-Tagging
협업 문서 경로: `ai-context`

## 1) 현재 상태
- 현재 단계: **Phase 2D 진행 중**
- 배포 상태: FE(Vercel) + BE(Railway) 운영 중
- 제품 상태: AI 제안 검수 중심에서 **AI 검수 + 사용자 수동 구간 생성**으로 확장 완료(1차)
- 최신 라벨링 UX: 박스 생성/이동/리사이즈, 수동 저장, 루프/HUD, 히스토리/undo 정합성 강화

## 2) 문서 우선순위
1. `ai-context/START-HERE.md`
2. `ai-context/master-plan.md`
3. `ai-context/project-context.md`
4. `ai-context/claude-implementation-brief-2026-02-12.md`
5. `ai-context/claude-coding-guideline.md`
6. `ai-context/codex-review-guideline.md`
7. `ai-context/archive/2026-02-24/session-log-2026-02-24.md` (최신 상세)
8. `ai-context/archive/2026-02-23/full-project-archive.md` (누적 이력)
9. `docs/architecture-diagrams.md` (구조 확인)

## 3) 최근 완료 항목 (2026-02-24)
- 수동 라벨 생성 API 추가: `POST /api/labeling/{session_id}/suggestions`
- Suggestion 모델 확장: `source`, `created_by`
- 라벨링 단축키 재정렬: `A=Select`, `G=Snap`, `Ctrl+Enter=수동 저장`
- 수동 draft 편집 강화: 이동/리사이즈 + `Ctrl+Z` 일관 복구
- export 확장: CSV/JSON에 `source`, `created_by` 포함
- FE lint/build 검증 통과, `origin/main` 반영 완료 (`5d0cd6b`)

## 4) 운영 규칙
- 작업 중에는 `ai-context/logs/*.md` 중심 갱신
- 핵심 흐름 변경 시 `archive`와 핵심 문서(본 파일 포함) 동기화
- 완료된 상세 로그/핸드오프/리포트는 `ai-context/archive/YYYY-MM-DD/`에 보관

## 5) 다음 우선순위
1. 수동 라벨링 UX 마무리: 엣지 리사이즈/키보드 미세조정/툴팁 가시성 개선
2. E2E 확장: 핫키/저장/파일 전환/루프/undo 회귀 자동화
3. DB 마이그레이션 정식화: `sst_suggestions.source`, `created_by` 컬럼 보장
4. Auth/RLS hardening: open policy를 사용자 기반 정책으로 전환
5. 운영 안정화: Supabase Storage 영속화/에러 모니터링(Sentry) 정착
