# Claude Coding Guideline (GameLab)

기준 폴더: `ai-context`

## 1) 시작 순서
1. `master-plan.md`
2. `project-context.md`
3. `worklog.md`
4. `review-log.md`
5. 제품 기준 문서 확인: `docs/Prd.md`, `docs/react.md`, `docs/bone.md`

## 2) 역할
- Claude는 구현 담당
- 문서 기준 우선순위에 따라 기능을 끝까지 구현

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
  1. 실행 명령 (`npm run build`, 필요한 경우 `npm run dev` 확인)
  2. 결과
- 리스크/후속 작업

## 6) 기록 규칙
- 구현 완료 즉시 `worklog.md`에 추가
- Codex 리뷰 피드백 반영 시 `review-log.md` 상태도 갱신

## 7) 실행 전 체크 (디버깅 표준)
- 작업 디렉토리는 반드시 `smart-spectro-tagging`로 이동 후 시작
- 시작 명령:
  1. `npm install`
  2. `npm run dev`
- 로그인 우회 정책:
  - 기본값: 우회 ON
  - 로그인 강제 디버깅: `.env.local`에 `NEXT_PUBLIC_BYPASS_LOGIN=false`
