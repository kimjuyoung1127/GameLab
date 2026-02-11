# GameLab Master Plan

기준일: 2026-02-10 (KST)  
프로젝트: Smart Spectro-Tagging (GameLab)  
협업 폴더: `ai-context`

## 1) 시작 문서 경로 (레포 루트 기준, 복붙용)
1. `ai-context/master-plan.md`
2. `ai-context/project-context.md`
3. `ai-context/claude-coding-guideline.md`
4. `ai-context/codex-review-guideline.md`
5. `ai-context/worklog.md`
6. `ai-context/review-log.md`
7. `ai-context/day-close-checklist.md`

## 2) 제품 기준 문서 (Source of Truth)
1. `docs/Prd.md`
2. `docs/react.md`
3. `docs/bone.md`

## 3) 현재 단계와 목표
- 현재 단계: Phase 1 (Frontend-First MVP)
- 목표:
  - 세션 생성/목록/진입 플로우 완성
  - 3패널 라벨링 워크스페이스 동작
  - AI 제안 O/X + Edit Mode + 점수 시스템 기본 동작
  - Mock 기반 저장/내보내기(JSON/CSV)까지 연결

## 4) 핵심 규칙
- 시간대: KST (`Asia/Seoul`)
- 라벨링 모드: `review` / `edit`
- 제안 처리:
  - Confirm: 점수 +10, 다음 제안 이동
  - Reject: Edit Mode 진입
  - Apply Fix: 점수 +20, review 복귀
- 데이터 일관성:
  - suggestion/annotation 상태 전이 추적 가능해야 함
  - undo/redo 경로를 끊지 말 것
- 협업 역할:
  - Claude: 구현 담당
  - Codex: 리뷰/리스크 검증 담당

## 5) 우선순위 백로그
1. `sessions` 생성 모달 + 목록 필터 안정화
2. `labeling/[id]` 3패널 UX 완성
3. `SpectrogramCanvas` 레이어(heatmap/AI/user/selection/cursor) 반영
4. `annotation-store` undo/redo, hotkeys(O/X/B/E/R, Ctrl+Z) 연결
5. autosave + offline queue 최소 구현
6. leaderboard mock + 점수/streak 반영
7. SoundLab 패턴 이식: heavy/light 분석 분리 + 타임라인/이벤트로그/스펙트럼모달 설계 반영

## 6) Phase 전환 기준
- Phase 1 -> 2 진입 조건:
  - 라벨링 코어 UX가 mock 데이터로 안정 동작
  - API 경계(`lib/api/endpoints.ts`)가 고정됨
  - 주요 화면이 모바일/데스크톱에서 깨지지 않음

## 7) 문서 신선도 규칙
- 협업 기준은 `ai-context` 폴더 문서만 사용
- 7일 이상 갱신이 없으면 개발 전에 문서 먼저 업데이트
- 작업 종료 시 `worklog.md`, `review-log.md`를 같은 턴에 반영
- 집/회사 공통으로, 절대경로 대신 레포 루트 상대경로만 사용

## 8) 완료 보고 형식
- 변경 요약
  1. 파일/기능
  2. 핵심 로직
  3. 영향 범위
- 검증
  1. 실행 명령
  2. 결과(성공/실패 + 핵심 로그)

## 9) Sprint Plan (2026-02-11, 안정화 우선)
1. 사이드바 404 링크 제거/비활성
   - 완료 기준: 사이드바 클릭으로 이동 가능한 메뉴만 노출되고 404 진입이 재현되지 않음
2. 세션-파일-제안 데이터 일관성 고정
   - 완료 기준: `/labeling/[id]` 직접 진입 시 해당 세션 파일/제안만 표시됨
3. annotation undo/redo 상태 스냅샷 보강
   - 완료 기준: `Reject -> Undo -> Redo`에서 `mode`, `selectedSuggestionId`, `suggestions`가 모두 일치 복원됨
4. Sessions Create 버튼 동작 구현
   - 완료 기준: Create 클릭 시 신규 세션 생성 후 `/labeling/{id}`로 이동됨
5. 로그인 우회 플래그 운영 규칙화
   - 완료 기준: 기본 우회 ON, `.env.local`의 `NEXT_PUBLIC_BYPASS_LOGIN=false` 설정 시 로그인 페이지 진입 확인
