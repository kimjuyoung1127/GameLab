# Zustand 상태 관리 (4개 독립 스토어)

## 스토어 목록

| 파일 | 훅 이름 | 핵심 상태 |
|------|---------|----------|
| `session-store.ts` | `useSessionStore` | sessions, currentSession, files, currentFileId |
| `annotation-store.ts` | `useAnnotationStore` | mode, tool, suggestions, annotations, undo/redo 스택 |
| `score-store.ts` | `useScoreStore` | score, streak, totalConfirmed, totalFixed |
| `ui-store.ts` | `useUIStore` | sidebarCollapsed, modalOpen, toastMessage, loading |

## 각 스토어 상세

### session-store.ts
- 세션 목록 및 현재 선택된 세션/파일 관리
- **주의: `setCurrentSessionById()`는 files를 리셋함**
- files 데이터가 필요하면 `setFiles()` 호출을 **반드시 뒤에** 배치

### annotation-store.ts
- 라벨링 모드: `review` (검토) / `edit` (편집)
- 도구: DrawTool 5종
- 핵심 액션:
  - `confirmSuggestion()` — AI 제안 승인 (+10점)
  - `rejectSuggestion()` — AI 제안 거절
  - `applyFix()` — 수동 수정 적용 (+20점)
- undo/redo 스택 내장 (`HistorySnapshot`)

### score-store.ts
- `persist` 미들웨어로 localStorage 저장 (키: `sst-score`)
- 초기값은 하드코딩 — **Phase 2에서 서버 동기화 필요**
- score, streak, totalConfirmed, totalFixed 추적

### ui-store.ts
- 사이드바 접기/펼치기, 모달, 로딩 상태
- toastMessage: 설정 후 **3초 자동 소멸**

## 규칙

- **스토어 간 직접 참조 금지** — 컴포넌트에서 각각 import하여 조합
- 새 전역 상태 추가 시 기존 스토어 확장 또는 새 스토어 생성
- persist가 필요한 경우 score-store 패턴 참고
