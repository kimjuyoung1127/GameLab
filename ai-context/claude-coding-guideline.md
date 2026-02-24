# Claude Coding Guideline (GameLab)

기준일: 2026-02-24 (KST)
기준 폴더: `ai-context`

## 1) 시작 순서 (고정)
1. `ai-context/START-HERE.md`
2. `ai-context/master-plan.md`
3. `ai-context/project-context.md`
4. `ai-context/claude-implementation-brief-2026-02-12.md`
5. `ai-context/claude-coding-guideline.md`
6. 필요 시 `ai-context/codex-review-guideline.md`
7. 구조 확인 필요 시 `docs/architecture-diagrams.md`
8. 최신 상세 이력 확인 시 `ai-context/archive/2026-02-24/session-log-2026-02-24.md`

실행 표준(프론트 기준):
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 2) 역할
- Claude: 구현 담당 (요구사항을 코드로 끝까지 반영)
- Codex: 리뷰/리스크 검증 담당

## 3) 구현 원칙
- Next.js App Router 구조 유지
- 공용 컴포넌트/스토어/타입 재사용 우선
- 도메인 의미가 분명한 상태/이벤트 이름 사용
- 문자열은 i18n/상수로 분리
- FE/BE 1:1 미러 규칙 유지

## 4) 라벨링 기능 필수 규칙 (최신)
- 모드 전이: `review -> edit -> review`
- 단축키 의미 고정:
  - `O` = AI 제안 확정 전용
  - `Ctrl+Enter` = 수동 draft 저장
  - `A` = Select, `G` = Snap Toggle, `R` = Box
- 편집 규칙:
  - 수동 박스 이동/리사이즈 가능
  - 이동/리사이즈 1회 동작은 undo 1회로 복구 가능
- 변경 동기화:
  - HotkeyHelp/툴바/HUD/i18n 문구 불일치 0건 유지

## 5) 완료 보고 형식
- 변경 요약
  1. 변경 파일
  2. 핵심 로직
  3. 영향 범위
- 검증
  1. 실행 명령 (`npm run lint`, `npm run build`)
  2. 결과
  3. 실패 시 로그 위치
- 리스크/후속 작업

## 6) 기록 규칙
- 작업 중: `ai-context/logs/*.md` append
- 핵심 변경/마감 시: `ai-context/archive/YYYY-MM-DD/` 반영
- 문서 최신화 시: START-HERE / master-plan / project-context / implementation-brief 동시 갱신

## 7) 필수 코딩 규칙
- 수정 전 파일 직접 읽기 (추측 금지)
- 기존 패턴 검색 후 재사용
- 중복 구현 금지
- 폴더별 `CLAUDE.md` 우선 확인
- 새 코드 파일 상단 한국어 기능 주석 유지

## 8) 분석 엔진 규칙
- `soundlab_v57` baseline은 보존
- 새 엔진은 별도 파일 + `registry.py` 등록
- 출력 포맷: `SuggestionDraft` 통일
- 엔진 설정: 버전별 JSON 파일 분리

## 9) 로그인/개발 모드
- 기본: 로그인 우회 ON (개발 편의)
- 강제 로그인 디버깅: `.env.local`에 `NEXT_PUBLIC_BYPASS_LOGIN=false`
