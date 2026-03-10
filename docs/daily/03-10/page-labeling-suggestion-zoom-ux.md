# 03-10 Labeling Suggestion Zoom UX Rework

## Route
- `/labeling/[id]`

## Completed
- [x] suggestion/manual draft single click -> full fit(time + frequency)로 통합
- [x] ToolBar `FIT` 토글 제거, `BAND` one-shot 액션 추가
- [x] empty canvas click -> selection clear only, viewport 유지
- [x] viewport toast/pulse feedback 추가
- [x] `useLabelingViewport` / `useLabelingFileNav` / `LlmAssistBlock` lint 정리
- [x] labeling docs sync

## Validation
- [x] `cd frontend && npm run lint`
- [x] `cd frontend && npm run test`
- [x] `cd frontend && npm run build`

## Notes
- keyboard selection(`Tab`, `Shift+Tab`, `↑`, `↓`)과 AUTO 기반 suggestion 이동은 viewport를 자동 변경하지 않음
- `BAND`는 선택된 region이 있을 때만 활성화되며 시간축 줌은 유지
- build 경고:
  - Next.js `middleware` 파일 컨벤션 deprecated (`proxy` 전환은 후속 작업)

## Doc Sync (2026-03-10 KST)
- synced:
  - `docs/status/PROJECT-STATUS.md`
  - `docs/status/PAGE-UPGRADE-BOARD.md`
  - `docs/status/SKILL-DOC-MATRIX.md`
  - `docs/status/INTEGRITY-REPORT.md`
  - `ai-context/master-plan.md`
  - `ai-context/project-context.md`
