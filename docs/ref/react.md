# React/Next.js Architecture Spec

Last Updated: 2026-02-10 (KST)

## 1. 목표
- Frontend-First MVP를 빠르게 완성
- FastAPI/Supabase 연동 시 구조 변경 최소화
- 화면/도메인/상태 분리를 명확히 유지

## 2. 폴더 구조 (project-root 기준)
```txt
project-root/
  src/
    app/
      (auth)/login/page.tsx
      (dashboard)/layout.tsx
      (dashboard)/page.tsx
      (dashboard)/sessions/page.tsx
      (dashboard)/labeling/[id]/page.tsx
      (dashboard)/leaderboard/page.tsx
      api/
    components/
      ui/
      layout/
      common/
      domain/
        dashboard/
        sessions/
        labeling/
        leaderboard/
    lib/
      store/
      hooks/
      mock/
      api/
      utils/
    types/
```

## 3. 라우팅
- `/login`: 인증 진입
- `/`: 대시보드
- `/sessions`: 세션 목록/생성
- `/labeling/[id]`: 라벨링 워크스페이스
- `/leaderboard`: 점수/순위

## 4. 도메인 컴포넌트
### 4.1 Sessions
- `SessionsPage`: 목록/필터/생성 모달 트리거
- `CreateSessionModal`: 세션 메타 입력 + 파일 업로드

### 4.2 Labeling Workspace
- `FileQueuePanel`: 파일 큐/현재 파일 전환
- `SpectrogramPanel`: 캔버스+툴바+플레이어
- `AISidePanel`: suggestion 카드 + O/X + Edit Mode
- `WorkspaceFooter`: 진행률/보조 정보

## 5. 상태관리 (Zustand)
### 5.1 session-store
- `currentSession`, `files`, `currentFileId`
- `setCurrentFile`

### 5.2 annotation-store
- `mode`, `tool`, `snapEnabled`
- `suggestions`, `annotations`, `selectedSuggestionId`
- `confirmSuggestion`, `rejectSuggestion`, `applyFix`, `undo`, `redo`

### 5.3 score-store
- `score`, `streak`, `addScore`

### 5.4 ui-store
- modal, toast, loading, offlineQueueCount

## 6. Hooks
- `use-hotkeys`: O/X/B/E/R, Ctrl+Z
- `use-spectrogram`: 오디오 -> 스펙트로그램 이미지
- `use-canvas-draw`: 포인터 이벤트/드로잉
- `use-magnetic-brush`: 보정 알고리즘
- `use-autosave`: idle 후 저장/오프라인 큐

## 7. 타입/계약
- 모든 mock 타입은 API 계약과 동일 구조 유지
- `Suggestion.status` 전이 규칙 명시:
  - `pending -> confirmed`
  - `pending -> rejected`
  - `rejected + fix -> corrected` (권장)

## 8. 구현 우선순위
1. Sessions + Create Modal
2. Labeling 3패널 레이아웃
3. O/X + Edit + 점수 반영
4. Canvas 입력/오버레이
5. autosave/offline queue
6. export + leaderboard

## 9. SoundLab 패턴 적용 설계
### 9.1 분석 파이프라인 분리
- `heavy-analysis`:
  - 파일 단위 전처리/특징 추출/기본 suggestion 계산
  - 실행 비용이 커서 캐시 대상
- `light-analysis`:
  - threshold/sensitivity/필터 옵션 변경 시 빠른 재계산
  - UI 슬라이더와 즉시 연동

### 9.2 서비스 레이어
- `lib/services/analysis-service.ts`:
  - `performHeavyAnalysis()`
  - `performLightAnalysis()`
  - `getDashboardMetrics()`
- UI는 store/hook을 통해 서비스만 호출하고, 알고리즘 상세를 직접 참조하지 않음

### 9.3 UI 연계 컴포넌트 (추가 권장)
- `components/domain/labeling/SpectralExplorerModal.tsx`
- `components/domain/labeling/SignalTimeline.tsx`
- `components/domain/labeling/EventLogTable.tsx`
- `components/domain/labeling/SmartSummaryCard.tsx`

### 9.4 상태 계약 보강
- `analysis-store`(신규 권장):
  - `heavyResult`
  - `lightResult`
  - `threshold`
  - `sensitivity`
  - `segments`
