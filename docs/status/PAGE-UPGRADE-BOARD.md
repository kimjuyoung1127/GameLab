# Page Upgrade Board

Source of truth for route-level execution status.

| route | label | group | priority | status | owner | page_skill | support_skills | must_read_docs | last_updated |
|---|---|---|---|---|---|---|---|---|---|
| `/login` | Login | Auth | P1 | Ready | unassigned | `page-login-upgrade` | `feature-form-validation-and-submit`, `feature-error-and-retry-state` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/overview` | Overview | Dashboard | P0 | InProgress | unassigned | `page-overview-upgrade` | `feature-data-binding-and-loading`, `feature-ui-empty-and-skeleton` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/upload` | Upload | Dashboard | P0 | InProgress | unassigned | `page-upload-upgrade` | `feature-form-validation-and-submit`, `feature-error-and-retry-state` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/sessions` | Sessions | Dashboard | P0 | InProgress | unassigned | `page-sessions-upgrade` | `feature-data-binding-and-loading`, `feature-analytics-and-tracking` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/leaderboard` | Leaderboard | Dashboard | P1 | Ready | unassigned | `page-leaderboard-upgrade` | `feature-ui-empty-and-skeleton`, `feature-data-binding-and-loading` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/profile` | Profile | Dashboard | P1 | QA | unassigned | `page-profile-upgrade` | `feature-data-binding-and-loading`, `feature-ui-empty-and-skeleton` | `docs/status/PROJECT-STATUS.md` | 2026-03-03 |
| `/labeling/[id]` | Labeling Workspace | Labeling | P0 | QA | unassigned | `page-labeling-upgrade` | `feature-navigation-and-gesture`, `feature-error-and-retry-state` | `docs/status/PROJECT-STATUS.md`, `docs/ref/architecture-diagrams.md` | 2026-03-03 |

## Status Flow

`Ready -> InProgress -> QA -> Done` (`Hold` for blocked work).

## Locked Decisions (Spectrogram Listening + Sprint 14)
- Target route: `/labeling/[id]`
- Hotkeys:
  - playback: `Space`
  - original selection playback: `O`
  - filtered selection playback: `F`
  - confirm suggestion: `C` (moved from `O`)
  - apply fix: `Shift+F` (moved from `F`)
- Sprint 14 완료 기능:
  - FFT 설정 패널 (크기/윈도우/동적범위)
  - 구간 재생 커서 동기화 (녹색 세로선)
  - 피치 보존 모드 (HTMLAudioElement.preservesPitch) — 기존 deferred에서 구현 완료
  - 0.25x~2.0x 재생 속도 범위
  - PNG 스크린샷 내보내기
- Sprint 14.1 진행 중 (2026-03-05):
  - 신뢰도 컬러 강도 (confidence 구간별 색상)
  - 제안 상태 필터 칩 (전체/대기/확인/수정)
  - 순차 자동 이동 + AUTO 토글
  - fitToSuggestion 기본값 OFF
  - 제안 클립보드 복사 (Copy 아이콘 → 포맷 텍스트)
- Deferred:
  - pitch-shift listening assist (저주파 모니터링)
