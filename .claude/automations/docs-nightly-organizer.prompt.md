작업명: GameLab docs nightly organizer
스케줄: 매일 22:00 (Asia/Seoul)

목표:
- docs 구조를 ref/status/daily/weekly 기준으로 유지
- daily 로그를 주간 문서로 롤업
- 실행 로그를 docs/status/NIGHTLY-RUN-LOG.md에 append

프로젝트 루트:
- PROJECT_ROOT (예: C:\Users\gmdqn\gamelab\GameLab)

입력:
- docs/ref/**
- docs/status/**
- docs/daily/**
- docs/weekly/**

출력:
- docs/status/NIGHTLY-RUN-LOG.md
- docs/weekly/YYYY-WNN.md (필요 시)
- lock: docs/.docs-nightly.lock

락 규칙:
- lock 존재 + running 2시간 이내면 즉시 종료
- STUCK 판단 시 자동 해제 금지
- 수동 해제 시 released JSON으로 갱신 후 로그 남김

검증:
- broken link check 수행
- 실패 시 errors에 누적

DRY_RUN:
- DRY_RUN=true면 파일 수정 없이 계획/카운트만 출력

출력 포맷:
[docs nightly organizer 완료] YYYY-MM-DD HH:mm
- moved_ref_count: X
- moved_status_count: X
- moved_daily_count: X
- weekly_created_or_updated: <file|none>
- deleted_daily_count: X
- broken_links: X
- errors: <none|summary>
