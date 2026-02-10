# 하루 마감 체크리스트 (GameLab)

기준 시간: KST
사용 위치: `ai-context`

## 1) 오늘 결과 정리
- [ ] `master-plan.md` 우선순위/진행률 갱신
- [ ] 오늘 완료/미완료를 3줄로 요약
- [ ] 내일 1~3순위 작업 확정

## 2) 로그 정리
- [ ] `worklog.md`에 변경 파일/검증 결과 기록
- [ ] `review-log.md`에 리뷰 결과/판단 기록
- [ ] 열린 이슈(open)와 해결 이슈(closed) 상태 구분

## 3) 품질 확인
- [ ] 최소 1개 검증 명령 수행 (`npm run build` 권장)
- [ ] 라벨링 핵심 플로우(O/X/Edit/Apply) 수동 점검
- [ ] UI 깨짐(모바일/데스크톱) 확인

## 4) 문서 신선도 점검
- [ ] 기준 문서가 여전히 `docs/Prd.md`, `docs/react.md`, `docs/bone.md`인지 확인
- [ ] 충돌 문서/오래된 외부 문서 참조 제거

## 5) 내일 시작 프롬프트 (복붙)
`레포 루트의 ai-context 기준으로 작업. master-plan -> project-context -> worklog -> review-log 순으로 읽고 1순위부터 진행.`
