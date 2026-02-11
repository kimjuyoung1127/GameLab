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
### [2026-02-11 17:00 KST] 백로그 #2~#6 구현 완료 리뷰 (Codex 리뷰 대비)
- 범위: `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx`, `leaderboard/page.tsx`, `score-store.ts`, `use-autosave.ts`
- 전체 위험도: 보통
- 최종 판단: 조건부 머지 가능 (아래 보통/낮음 이슈 후속 처리)

#### 이전 높음 이슈 해결 현황
- [해결됨] Sidebar 404 라우트 → 실제 라우트만 노출 (커밋 `3dd4329`)
- [해결됨] labeling/[id] 세션 데이터 혼입 → `setCurrentSessionById(id)` + fallback 제거 (커밋 `3dd4329`)
- [해결됨] undo/redo suggestions만 복원 → `HistorySnapshot` 기반 3필드 복원 (커밋 `3dd4329`)
- [해결됨] Create Session 무동작 → `createSession` 스토어 연결 + 라벨링 이동 (커밋 `3dd4329`)
- [해결됨] 로그인 우회 플래그 문서화 부족 → README + claude-coding-guideline 명시 (커밋 `3dd4329`)

#### 신규 이슈
- [보통] `labeling/[id]/page.tsx:517` - 동적 annotation 태그 라벨의 `${sc.bg}/90` 구문이 Tailwind의 동적 클래스 생성 특성상 purge될 위험 - 운영 빌드에서 태그 배경색 미적용 가능 - safelist 추가 또는 인라인 style로 교체 권장
- [보통] `labeling/[id]/page.tsx` - 스펙트로그램 캔버스가 CSS gradient/div 기반 mock - 실제 오디오 데이터 시각화 미구현 - Phase 2에서 Canvas API/WebGL 기반으로 교체 필요
- [보통] `use-autosave.ts` - autosave가 localStorage 단일 키 저장 → 다중 파일 동시 작업 시 마지막 파일만 복원됨 - 키를 `sst-autosave-${audioId}`로 변경 권장 (Phase 2)
- [낮음] `score-store.ts` - persist 초기값(9420, streak:12)이 localStorage가 비어 있을 때만 적용 → 기존 사용자가 잘못된 점수를 가질 수 있음 - reset 기능 또는 버전 키 도입 권장
- [낮음] `leaderboard/page.tsx` - Samples(45), Speed(3.1s/tag), Duration(14m 20s) 하드코딩 → store 연동 미완 - Phase 2에서 연산 기반 값으로 교체
- [낮음] `labeling/[id]/page.tsx` - 재생 커서 위치(38%) 하드코딩 → Web Audio API 연동 시 실시간 업데이트 필요

#### 검증 항목
1. `npm run build` 성공 (모든 라우트 정상 생성, TypeScript 오류 없음)
2. 커밋 히스토리: `639c109` → `b7ca706` (2건 추가, origin/main 동기화 완료)
3. 핫키 O/X/B/E/R/S/F + Ctrl+Z/Shift+Ctrl+Z 동작 확인
4. Confirm → Reject → Undo → Redo 상태 복원 경로 정상
5. 동적 annotation 박스: suggestion 데이터 기반 위치/크기 렌더링 확인
6. autosave: 30초 주기 + beforeunload 저장 동작 확인
7. score-store: localStorage 영속성 확인

#### 잔여 리스크
- Tailwind 동적 클래스 purge 가능성 (태그 라벨 배경색)
- 다중 파일 autosave 키 충돌
- SoundLab 패턴 이식(백로그 #7) 미착수

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
