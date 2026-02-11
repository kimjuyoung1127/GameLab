# 하루 마감 체크리스트 (GameLab)

기준 시간: KST
사용 위치: `ai-context`

## 1) 오늘 결과 정리
- [ ] `master-plan.md` 우선순위/진행률 갱신
- [ ] 오늘 완료/미완료를 3줄로 요약
- [ ] 내일 1~3순위 작업 확정

## 2) 로그 정리
- [ ] `ai-context/logs/YYYY-MM-DD-session-log.md`에 오늘 작업 append
- [ ] handoff(`sprint-handoff-*.md`)가 최신 상태인지 확인
- [ ] 마일스톤 종료일이 아니면 `worklog.md/review-log.md`는 스킵

## 3) 품질 확인
- [ ] `npm run build` 결과 기록
- [ ] 라벨링 핵심 플로우(O/X/Edit/Apply) 수동 점검
- [ ] UI 깨짐(모바일/데스크톱) 확인

## 4) 문서 신선도 점검
- [ ] 기준 문서가 `docs/Prd.md`, `docs/react.md`, `docs/bone.md`인지 확인
- [ ] 충돌 문서/오래된 외부 문서 참조 제거

## 5) Sprint 11 내일 시작 프롬프트 (복붙)
`레포 루트 ai-context 기준으로 시작. master-plan -> project-context -> sprint-handoff-2026-02-11-pm -> worklog -> review-log 순으로 읽고, Sprint 11 진행중 항목(동적 클래스/autosave 키/문서 포맷 정규화)부터 처리.`

실행 경로/명령(필수):
1. `cd smart-spectro-tagging`
2. `npm install`
3. `npm run dev`

당일 마감 필수 3개(기본):
1. session log append
2. handoff 갱신
3. `npm run build` 결과 기록

마일스톤 종료일 추가 필수:
1. `worklog.md` 일괄 업데이트
2. `review-log.md` 일괄 업데이트
3. `master-plan.md` 상태 반영

로그인 우회 기본값:
- 기본 ON (바로 `/sessions` 진입)
- 로그인 강제 필요 시 `.env.local`에 `NEXT_PUBLIC_BYPASS_LOGIN=false`
