# Sprint Handoff (2026-02-11)

## 1) 배경/목표
- 현재 스프린트 목표는 기능 확장이 아니라 디버깅 생산성과 상태 일관성 확보다.
- 루트(`GameLab`)에서 `npm run dev`를 실행하면 `package.json`이 없어 실패하므로 실행 기준 경로를 고정한다.
- Claude가 추가 의사결정 없이 바로 구현/검증할 수 있도록 이번 안정화 스펙을 문서로 고정한다.

## 2) 범위 (In / Out)
- In
  - 404 링크 제거
  - 세션-파일-제안 데이터 정합성 고정
  - undo/redo 스냅샷 정확도 보강
  - Sessions Create 동작 연결
  - 로그인 우회 플래그 운영 규칙 명시
- Out
  - 실제 인증 시스템 구현
  - 백엔드 API/DB 연동
  - 디자인 전면 개편

## 3) 파일별 구현 지시

### `smart-spectro-tagging/src/components/layout/Sidebar.tsx`
- 404를 유발하는 라우트(`/analysis`, `/files`, `/settings`)를 제거한다.
- 실제 구현된 라우트만 노출한다: `/`, `/sessions`, `/leaderboard`.

### `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx`
- `useParams`로 `id`를 읽고 `session-store`의 `setCurrentSessionById(id)`를 호출한다.
- 세션이 없으면 `/sessions`로 리다이렉트한다.
- 파일 목록은 선택된 세션 기준 `files`만 사용하고 fallback mock 혼합을 금지한다.
- `activeFileId` 변경 시 `loadSuggestions(activeFileId)`를 호출해 제안 데이터를 동기화한다.

### `smart-spectro-tagging/src/lib/store/session-store.ts`
- API 확장:
  - `createSession(input)`
  - `setCurrentSessionById(id)`
- `createSession`은 mock 단계에서 즉시 동작 가능한 신규 세션 객체를 생성하고 `sessions` 선두에 추가한다.
- `setCurrentSessionById`는 `currentSession`, `files`, `currentFileId`를 일관성 있게 세팅한다.

### `smart-spectro-tagging/src/lib/store/annotation-store.ts`
- undo/redo 스택 타입을 `AISuggestion[][]`에서 `HistorySnapshot[]`로 변경한다.
- 스냅샷 필드:
  - `mode`
  - `selectedSuggestionId`
  - `suggestions`
- `confirmSuggestion`, `rejectSuggestion`, `applyFix` 실행 전 현재 스냅샷을 `undoStack`에 저장한다.
- `undo`, `redo`에서 위 3개 상태를 모두 복원한다.

### `smart-spectro-tagging/src/app/(dashboard)/sessions/page.tsx`
- Create Session 버튼 클릭 시 `createSession` 호출 후 `/labeling/{newSession.id}`로 이동한다.
- 신규 세션은 최소 입력(기본 이름 + pending 상태 + 0% progress)으로 생성한다.

### `smart-spectro-tagging/src/app/page.tsx`
- 기본 정책 유지: `NEXT_PUBLIC_BYPASS_LOGIN !== "false"`이면 `/sessions`, 아니면 `/login`.

### `smart-spectro-tagging/src/app/(auth)/login/page.tsx`
- 우회 ON이면 즉시 `/sessions`로 이동한다.
- 우회 OFF일 때만 로그인 폼을 표시한다.

### `smart-spectro-tagging/README.md`
- 실행 위치를 `smart-spectro-tagging`으로 명시한다.
- 디버깅 플래그 규칙(`NEXT_PUBLIC_BYPASS_LOGIN`)을 명시한다.

## 4) 타입/인터페이스 변경
- `HistorySnapshot` 타입 도입
  - 파일: `smart-spectro-tagging/src/types/index.ts`
- `session-store` 확장
  - `createSession(input)`
  - `setCurrentSessionById(id)`

## 5) 테스트/검증 명령
실행 경로: `GameLab/smart-spectro-tagging`
1. `npm run lint`
2. `npm run build`

## 6) 수용 기준 (Acceptance Criteria)
1. 사이드바에서 클릭 가능한 메뉴로 404가 발생하지 않는다.
2. `/labeling/{id}` 직접 접근 시 해당 세션 파일/제안만 보인다.
3. `Reject -> Undo -> Redo` 수행 시 상태(`mode`, 선택 제안, 제안 배열)가 일치 복원된다.
4. Sessions에서 Create 클릭 시 신규 세션 생성 후 labeling 화면으로 이동한다.
5. 로그인 우회 ON/OFF가 `.env.local` 설정대로 동작한다.

## 7) 리스크/롤백 기준
- 리스크
  - mock 기반 세션 생성으로 실제 파일이 없는 신규 세션은 빈 파일 목록일 수 있다.
  - 향후 API 연동 시 `createSession` 반환 구조를 서버 스키마와 맞춰야 한다.
- 롤백 기준
  - lint/build 실패 또는 라우팅 회귀 시, 변경된 스토어/페이지 단위로 되돌리고 최소 동작(기존 session 진입)만 유지한다.
