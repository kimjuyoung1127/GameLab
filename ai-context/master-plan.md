# GameLab Master Plan

기준일: 2026-02-23 (KST)
프로젝트: Smart Spectro-Tagging
협업 문서 경로: `ai-context`

## 1) 현재 상태
- 현재 단계: Phase 2D 진행 중
- 안정 상태: Sprint 12.2~13.9 이력은 `archive/2026-02-23/full-project-archive.md`에 통합 보관
- 핵심 원칙: FE/BE 도메인 1:1 미러 구조 유지

## 2) 문서 우선순위
1. `ai-context/START-HERE.md`
2. `ai-context/master-plan.md`
3. `ai-context/project-context.md`
4. `ai-context/claude-coding-guideline.md`
5. `ai-context/codex-review-guideline.md`
6. `ai-context/archive/2026-02-23/full-project-archive.md` (히스토리 확인 시)

## 3) 레포 구조 (현재)
```text
GameLab/
├── ai-context/
├── backend/
├── frontend/
├── docs/
└── scripts/
```

## 4) 운영 규칙
- 작업 중에는 `ai-context/logs/*.md`만 갱신
- 마일스톤 종료 시에만 계획/회고 문서 반영
- 완료된 상세 로그/핸드오프/리포트는 `ai-context/archive/YYYY-MM-DD/`에 보관

## 5) 다음 우선순위
1. 배포 환경 안정화 (FE/BE 연동 점검)
2. 분석 파이프라인 성능/정확도 검증 자동화
3. Auth/RLS 정책 보안 강도 상향 (open policy 제거)
4. E2E 테스트(핫키/업로드/세션 흐름) 확장
