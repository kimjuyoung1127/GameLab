# Claude Coding Guideline (GameLab)

기준 폴더: `ai-context`

## 1) 시작 순서
1. `master-plan.md`
2. `project-context.md`
3. `ai-context/archive/2026-02-12/sprint-close-2026-02-12-s12.5.md`
4. `ai-context/logs/2026-02-12-session-log.md`
5. 제품 기준 문서 확인: `docs/Prd.md`, `docs/react.md`, `docs/bone.md`

실행 표준(시작 순서 바로 적용):
1. `cd smart-spectro-tagging`
2. `npm install`
3. `npm run dev`

## 2) 역할
- Claude는 구현 담당
- 문서 기준 우선순위에 따라 기능을 끝까지 구현
- Codex는 리뷰/리스크 검증 담당

## 3) 구현 원칙
- Next.js App Router 구조 유지
- 공용 컴포넌트/스토어/타입 재사용 우선
- 상태 이름/이벤트 이름은 도메인 의미가 분명해야 함
- Mock 데이터 구조를 Phase 2 API 스펙과 맞춰 유지
- 하드코딩 문자열은 i18n 또는 상수로 분리

## 4) 라벨링 기능 필수 규칙
- 모드 전이: `review -> edit -> review`
- O Confirm: 상태 변경 + 점수 증가 + 다음 제안 포커스
- X Reject: edit 모드 전환 + 수정 안내
- Apply Fix: annotation 반영 + 점수 증가
- undo/redo 스택 무결성 유지

## 5) 완료 보고 형식
- 변경 요약
  1. 변경 파일
  2. 핵심 로직
  3. 영향 범위
- 검증
  1. 실행 명령 (`npm run build`, 필요 시 `npm run dev`)
  2. 결과
  3. 실패 시 로그 위치 (`C:\Users\<user>\AppData\Local\npm-cache\_logs\*.log`)
- 리스크/후속 작업

## 6) 기록 규칙 (토큰 절약 운영)
- 작업 중에는 `sprint-handoff-*.md` + `ai-context/logs/*.md`만 갱신
- `worklog.md`, `review-log.md`, `master-plan.md`는 마일스톤 종료 시 1회 일괄 갱신
- 커밋 ID와 작업 항목은 session log에 먼저 매핑하고, 마감 시 공용 문서로 반영

권장 흐름:
1. 작업 중: `sprint-handoff-*.md` 최신화
2. 작업 중: `ai-context/logs/YYYY-MM-DD-session-log.md` append
3. 마감 시: `worklog.md` + `review-log.md` + `master-plan.md` 일괄 정리

## 7) 로그인 우회 정책
- 기본값: 우회 ON
- 로그인 강제 디버깅: `.env.local`에 `NEXT_PUBLIC_BYPASS_LOGIN=false`
