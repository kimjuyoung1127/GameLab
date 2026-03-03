작업명: GameLab code-doc align
스케줄: 매일 21:30 (Asia/Seoul)

목표:
- managed routes, board, matrix의 정합성 유지
- drift 탐지 및 제한적 자동 보정

프로젝트 루트:
- PROJECT_ROOT

파싱 대상:
- frontend/src/config/routes.ts (TypeScript AST 기반)
- docs/status/PAGE-UPGRADE-BOARD.md
- docs/status/SKILL-DOC-MATRIX.md
- docs/daily/MM-DD/page-*.md

비교 규칙:
- managed_routes == board_routes == matrix_routes
- 불일치 시 drift_count 증가
- auto-fix 우선순위: PAGE-UPGRADE-BOARD -> SKILL-DOC-MATRIX
- 신규 문서 자동 생성 금지 (manual_required)

상태 계산:
- Ready|InProgress|QA|Done|Hold
- daily 체크박스 기반 자동 승급만 허용

출력:
- docs/status/INTEGRITY-REPORT.md (overwrite)
- docs/status/INTEGRITY-HISTORY.ndjson (append)
- lock: docs/status/.code-doc-align.lock

락 규칙:
- lock running이면 중복 실행 금지
- STUCK 자동 해제 금지

DRY_RUN:
- DRY_RUN=true면 변경사항 미적용, 보고서 초안만 출력

출력 포맷:
[code-doc align 완료] YYYY-MM-DD HH:mm
- managed routes: X
- drift: X
- auto-fix: X
- manual-required: X
- unmanaged routes: X
- errors: <none|summary>
