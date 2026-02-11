# 리뷰 로그 (GameLab)

기준 폴더: `ai-context`
기준 시간: KST

## 작성 규칙
- 심각도 순: 치명적 -> 높음 -> 보통 -> 낮음
- 형식: `[심각도] 파일:라인 - 문제 - 영향 - 수정 제안`
- 리뷰 결론(머지 가능/조건부/불가)을 반드시 기록

## 템플릿
### [YYYY-MM-DD HH:mm KST] 리뷰 대상
- 범위:
- 전체 위험도:
- 최종 판단:

#### 이슈
- [심각도] `파일:라인` - 문제 - 영향 - 수정 제안

#### 검증 항목
1. 항목
2. 항목

## 기록
### [2026-02-11 10:15 KST] 안정화 스프린트(Phase 1 Gate) 우선 리스크 리뷰
- 범위: `smart-spectro-tagging/src/*`, `ai-context/*.md`
- 전체 위험도: 높음
- 최종 판단: 조건부 머지 가능 (아래 높음 이슈 우선 반영 필요)

#### 이슈
- [높음] `smart-spectro-tagging/src/components/layout/Sidebar.tsx` - 미구현 라우트(`/analysis`, `/files`, `/settings`) 노출 - 사용자가 즉시 404 진입 - 실제 페이지 라우트만 남기고 미구현 메뉴 제거
- [높음] `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx` - 세션 URL과 파일/제안 데이터가 분리되어 mock fallback으로 혼입 가능 - 잘못된 세션 데이터로 라벨링 위험 - URL 기반 세션 동기화 + fallback 제거 필요
- [높음] `smart-spectro-tagging/src/lib/store/annotation-store.ts` - undo/redo가 suggestions만 복원 - mode/selectedSuggestionId 불일치로 편집 상태 회귀 - `HistorySnapshot`으로 복원 단위 확장 필요
- [보통] `smart-spectro-tagging/src/app/(dashboard)/sessions/page.tsx` - Create Session 버튼 무동작 - 세션 생성 플로우 E2E 검증 불가 - `createSession` 스토어 API 연결 필요
- [보통] `smart-spectro-tagging/src/app/page.tsx`, `smart-spectro-tagging/src/app/(auth)/login/page.tsx` - 로그인 우회 플래그 운영 기준 문서화 부족 - 환경별 디버깅 동작 혼선 - `.env.local` 기준과 기본값을 협업 문서/README에 명시 필요

#### 확인 결과
- 안정화 우선순위를 `ai-context/master-plan.md`의 Sprint Plan으로 고정
- 구현 지시를 `ai-context/sprint-handoff-2026-02-11.md`에 결정 완료 형태로 정리

#### 잔여 리스크
- 신규 세션은 mock 단계에서 파일이 비어 있을 수 있어 labeling 진입 후 빈 상태 UX 보완 필요

### [2026-02-10 13:00 KST] SoundLab(frontend) 자산 재사용성 리뷰
- 범위: `C:\Users\ezen601\Desktop\Jason\SoundLab\frontend\src/*`, `docs/*.md`, `ai-context/*.md`
- 전체 위험도: 보통
- 최종 판단: 조건부 머지 가능

#### 이슈
- [보통] `SoundLab/frontend/src/ui/live_tab.py` - UI 루프 내부 `time.sleep` 기반 폴링 구조는 Next.js/React로 직접 이식 시 UX/렌더 충돌 위험 - 프론트 폴링/서버 스트리밍 경계를 분리한 아키텍처로 재설계 필요
- [보통] `SoundLab/frontend/src/core/analysis.py` - 상태머신/후처리 규칙이 함수 내부에 밀집 - GameLab 이식 시 서비스 레이어와 룰 엔진 분리 필요
- [낮음] `SoundLab/frontend/src/ui/*` - Streamlit 컴포넌트 의존성이 높아 UI 코드는 재사용 불가 - 상호작용 패턴만 재사용 권장

#### 확인 결과
- 재사용 가치 높은 항목(heavy/light 분석 분리, Otsu threshold, 세그먼트 타임라인, 이벤트로그-하이라이트, CSV export) 식별
- 위 항목을 `docs/Prd.md`, `docs/react.md`, `docs/wireframe.md`, `docs/bone.md`, `docs/scaffolding.md`에 반영
- 협업 기준 문서(`ai-context/project-context.md`, `ai-context/master-plan.md`)에도 이식 원칙 반영

#### 잔여 리스크
- 실제 코드베이스(`src`)가 아직 없어 문서 기반 검증만 수행됨

### [2026-02-10 12:10 KST] ai-context 전환 리뷰
- 범위: `ai-context/*.md`
- 전체 위험도: 낮음
- 최종 판단: 머지 가능

#### 확인 결과
- ERP 문맥/경로가 제거되고 GameLab 문맥으로 전환됨
- 시작 문서 경로를 레포 루트 상대경로로 통일함
- 역할/로그/체크리스트 규칙이 라벨링 프로젝트 기준으로 정렬됨

#### 잔여 리스크
- 없음
