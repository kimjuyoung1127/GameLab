# 리뷰 로그 (GameLab)

기준 폴더: `ai-context`
기준 시간: KST

## 작성 규칙
- 오픈 이슈는 심각도 순으로 기록: 보통 -> 낮음
- 이슈 형식 고정: `[심각도] 파일:라인 - 문제 - 영향 - 수정 제안 - 검증 방법`
- 해결된 이슈는 `해결됨` 섹션으로 분리
- 리뷰 결론(머지 가능/조건부/불가)을 반드시 기록

## 템플릿
### [YYYY-MM-DD HH:mm KST] 리뷰 대상
- 범위:
- 전체 위험도:
- 최종 판단:

#### 해결됨
- [해결됨] `파일:라인` - 해결 내용 - 근거 커밋

#### 오픈 이슈
- [보통] `파일:라인` - 문제 - 영향 - 수정 제안 - 검증 방법
- [낮음] `파일:라인` - 문제 - 영향 - 수정 제안 - 검증 방법

## 기록
### [2026-02-11 18:20 KST] Codex 리뷰 대비 문서/상태 정합성 리뷰
- 범위: `ai-context/*.md`, `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx`, `smart-spectro-tagging/src/lib/hooks/use-autosave.ts`, `smart-spectro-tagging/src/lib/store/score-store.ts`
- 전체 위험도: 보통
- 최종 판단: 조건부 머지 가능 (오픈 보통 이슈 우선 해소 권장)

#### 해결됨
- [해결됨] `smart-spectro-tagging/src/components/layout/Sidebar.tsx:1` - 미구현 메뉴 제거로 404 진입 차단 - 근거 커밋 `3dd4329`
- [해결됨] `smart-spectro-tagging/src/lib/store/session-store.ts:1` - 세션 진입 데이터 혼입 제거(`setCurrentSessionById`) - 근거 커밋 `3dd4329`
- [해결됨] `smart-spectro-tagging/src/lib/store/annotation-store.ts:1` - undo/redo 복원 단위 확장(`HistorySnapshot`) - 근거 커밋 `3dd4329`
- [해결됨] `smart-spectro-tagging/src/app/(dashboard)/sessions/page.tsx:1` - Create Session 버튼 동작 연결 - 근거 커밋 `3dd4329`
- [해결됨] `ai-context/claude-coding-guideline.md:1` - 실행/우회 정책 문서화 - 근거 커밋 `3dd4329`

#### 오픈 이슈
- [해결됨] `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx:57` - `${sc.bg}/90` 동적 Tailwind 클래스 → `tagBg` 필드로 정적 클래스 리터럴 전환 - 근거 커밋 (Sprint 11 P1)
- [해결됨] `smart-spectro-tagging/src/lib/hooks/use-autosave.ts:6` - 단일 키 → `sst-autosave-${audioId}` 파일별 키 분리 + legacy 마이그레이션 - 근거 커밋 (Sprint 11 P1)
- [보통] `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx:470` - CSS mock 기반 스펙트로그램 - 실제 오디오 데이터 기반 시각화 부재 - Phase 2에서 Canvas/WebGL 렌더 경로로 교체 - PoC 브랜치에서 동일 제안 좌표 렌더 정확도 확인
- [낮음] `smart-spectro-tagging/src/lib/store/score-store.ts:1` - persist 버전/마이그레이션 미도입 - 기존 localStorage 데이터와 충돌 가능 - `version`/`migrate` 도입 - 기존 저장 데이터가 있는 브라우저에서 재실행 검증
- [낮음] `smart-spectro-tagging/src/app/(dashboard)/leaderboard/page.tsx:120` - Samples/Speed/Duration 하드코딩 - 실제 운영 지표 신뢰성 저하 - store selector 연동으로 계산값 치환 - score/세션 데이터 변경 시 카드 값 동기화 검증
- [낮음] `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx:585` - 커서 위치(38%) 하드코딩 - 재생 위치 UX 부정확 - Web Audio API currentTime 기반 위치 계산 - 재생/일시정지 시 커서 이동 검증
