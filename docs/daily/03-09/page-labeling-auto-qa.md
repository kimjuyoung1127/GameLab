# 03-09 Labeling AUTO Semantics + QA Baseline

## Route
- `/labeling/[id]`

## Completed
- [x] `annotation-store` next-pending 탐색 로직 공통화
- [x] `Apply Fix`가 `AUTO` 토글을 따르도록 수정 (`AUTO OFF` 시 현재 corrected suggestion 유지)
- [x] labeling draft/upload hooks lint 오류 수정
- [x] `vitest` 도입 + annotation store 상태 전이 테스트 6개 추가
- [x] labeling/status docs sync

## Validation
- [x] `cd frontend && npm run lint`
- [x] `cd frontend && npm run test`
- [x] `cd frontend && npm run build`

## Notes
- `confirmSuggestion()`는 기존 UX를 유지해 `AUTO OFF`일 때 다음 pending으로 자동 이동하지 않고 selection을 비운다.
- `applyFix()`는 `AUTO OFF`일 때 현재 corrected suggestion을 유지해 수정 결과를 바로 확인할 수 있게 했다.
- Next.js build 경고:
  - `middleware` 파일 컨벤션 deprecated, `proxy` 전환 필요 (후속 작업)

## Doc Sync (2026-03-09 KST)
- synced:
  - `docs/status/PROJECT-STATUS.md`
  - `docs/status/PAGE-UPGRADE-BOARD.md`
  - `docs/status/INTEGRITY-REPORT.md`
  - `docs/status/INTEGRITY-HISTORY.ndjson`
