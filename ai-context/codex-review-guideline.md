# Codex Review Guideline (GameLab)

기준 폴더: `ai-context`

## 1) 시작 순서
1. `master-plan.md`
2. `project-context.md`
3. `worklog.md`
4. `review-log.md`
5. 기준 문서: `docs/Prd.md`, `docs/react.md`

## 2) 역할
- Codex는 리뷰/검증 전담
- 우선순위: 동작 오류 -> 데이터 정합성 -> UX 회귀 -> 구조 일관성 -> 테스트 누락

## 3) 필수 점검 항목
- 세션 생성 후 라벨링 페이지 진입 경로 정상 여부
- 3패널(파일/캔버스/AI패널) 상태 동기화 여부
- O/X/Apply Fix에 따른 상태/점수/streak 일관성
- undo/redo 동작과 모드 전이 충돌 여부
- autosave/offline queue 실패 복구 경로
- 모바일/데스크톱 레이아웃 파손 여부

## 4) 리뷰 기록 형식
- `[심각도] 파일:라인 - 문제 - 영향 - 수정 제안`
- 심각도 순서: 치명적 -> 높음 -> 보통 -> 낮음

## 5) 판단 기준
- 머지 가능: 치명적/높음 이슈 없음
- 조건부: 보통 이슈는 허용하되 후속 작업 명시
- 머지 불가: 치명적 또는 사용자 플로우 차단 이슈 존재

## 6) 기록 규칙
- 리뷰 완료 즉시 `review-log.md`에 누적
- 동일 이슈 재발 시 "재발"로 표기하고 원인 추적 메모 추가
