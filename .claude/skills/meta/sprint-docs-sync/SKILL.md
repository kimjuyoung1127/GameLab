---
name: sprint-docs-sync
description: "스프린트 완료 후 문서 일괄 동기화 — sprint docs, 문서 동기화, status update, 스프린트 완료, docs sync"
---

## Trigger
사용자가 "sprint complete", "스프린트 완료", "docs sync", "문서 동기화"를 요청하거나, 주요 기능 머지 후 문서 갱신이 필요할 때 활성화.

## Input Context
- 스프린트 번호
- 완료된 기능 목록
- 새로 추가된 라우트/단축키/모델 여부

## Read First
1. `docs/status/PROJECT-STATUS.md` — 현재 상태
2. `docs/status/PAGE-UPGRADE-BOARD.md` — 라우트 상태 보드
3. `docs/status/SKILL-DOC-MATRIX.md` — 스킬-코드-문서 매핑
4. `docs/status/INTEGRITY-REPORT.md` — 정합성 상태
5. `docs/status/INTEGRITY-HISTORY.ndjson` — 이력
6. `docs/status/NIGHTLY-RUN-LOG.md` — 야간 실행 로그
7. `ai-context/master-plan.md` — 마스터 플랜
8. `ai-context/project-context.md` — 프로젝트 컨텍스트
9. `frontend/src/config/routes.ts` — managed routes (진실 원본)

## Do
1. `PROJECT-STATUS.md` 갱신: 현재 phase, 스프린트 요약, 단축키 정책 (변경 시), next actions
2. `PAGE-UPGRADE-BOARD.md` 갱신: 라우트 상태 (Ready/InProgress/QA/Done), last_updated
3. `SKILL-DOC-MATRIX.md` 갱신: 새 코드 경로가 추가된 page_skill 행
4. `INTEGRITY-REPORT.md` 갱신: 새 기능에 대한 검증 항목 추가, 시각 갱신
5. `INTEGRITY-HISTORY.ndjson` 갱신: 새 엔트리 append
6. `NIGHTLY-RUN-LOG.md` 갱신: 수동 실행 기록 추가
7. `master-plan.md` 갱신: 최근 완료 항목, 다음 우선순위
8. `project-context.md` 갱신: 현재 단계, 기능 목록
9. 새 라우트 추가 시 routes.ts == board == matrix 정합성 확인
10. managed_routes == board_routes == matrix_routes → drift 0 보장

## Do Not
1. 실제 코드와 대조하지 않고 문서를 갱신하지 않는다
2. PROJECT-STATUS의 이전 스프린트 항목을 삭제하지 않는다
3. 상태 파일명을 변경하지 않는다 (자동화가 의존함)
4. routes.ts, board, matrix 간 drift를 남기지 않는다

## Validation
- [ ] PROJECT-STATUS.md 갱신됨
- [ ] PAGE-UPGRADE-BOARD.md 라우트 상태 최신화
- [ ] SKILL-DOC-MATRIX.md primary_code_paths 정확
- [ ] INTEGRITY-REPORT.md 새 검증 항목 추가됨
- [ ] INTEGRITY-HISTORY.ndjson 새 엔트리 추가됨
- [ ] managed_routes == board_routes == matrix_routes (zero drift)
- [ ] master-plan.md 현재 상태 반영됨
- [ ] project-context.md 현재 상태 반영됨

## Output Template
```
[sprint-docs-sync 완료]
- 스프린트: Sprint {n}
- 업데이트 문서: {count}개
- managed_routes: {n}
- drift: 0
- 새 기능 반영: {features}
```
