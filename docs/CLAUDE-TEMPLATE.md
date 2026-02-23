# {프로젝트명}

## 핵심 개발 원칙
1. 파일 수정 전 반드시 현재 파일 내용을 직접 읽고 작업한다.
2. 기존 코드(타입/훅/함수/API)를 우선 재사용하고 중복 구현을 피한다.
3. 백엔드 모델/응답 변경 시 프론트 타입/클라이언트도 1:1로 함께 갱신한다.
4. 모든 신규 코드 파일 상단에는 1~3줄 요약 주석을 둔다.
5. 하드코딩 문자열은 가능한 한 분리 가능한 구조로 유지한다.
6. 작업 시작 전 해당 폴더의 CLAUDE.md를 먼저 확인한다.

## 빠른 시작
- FE: `cd frontend && npm install && npm run dev` (port {FE_PORT})
- BE: `cd backend && {BE_INSTALL_CMD} && {BE_RUN_CMD}` (port {BE_PORT})
- 테스트: `{TEST_CMD}`
- 빌드: `cd frontend && npm run build`
- 린트: `cd frontend && npm run lint`

## 기본 구조
- `backend/`: {BE 프레임워크} + {DB}
- `frontend/`: {FE 프레임워크} + {상태관리}
- `docs/`: 제품/스키마 문서
- `ai-context/`: 작업 컨텍스트 및 계획 문서
- `scripts/`: 공용 유틸 스크립트

## 환경 변수
- FE: `frontend/.env.local`
  - `{FE_ENV_1}` — {설명}
  - `{FE_ENV_2}` — {설명}
- BE: `backend/.env`
  - `{BE_ENV_1}` — {설명}
  - `{BE_ENV_2}` — {설명}
- 주의: {설정 프레임워크}가 기본값을 override하므로 코드와 .env 양쪽 확인 필요

## BE ↔ FE 미러 구조
- `backend/{models_path}/{domain}.py` ↔ `frontend/{types_path}/{domain}.ts`
- `backend/{api_path}/{domain}/router.py` ↔ `frontend/{api_client_path}/{domain}.ts`
- 도메인: {도메인1}, {도메인2}, {도메인3}, ...
- barrel re-export: `{BE_barrel}` / `{FE_barrel}`
- BE 모델 변경 시 FE 타입 반드시 동시 갱신

## FE 레이어 규칙
- `app/` → components, lib, types 의존 가능
- `components/` → lib, types 의존 가능
- `lib/` → types만 의존 (app/components 절대 import 금지)
- `types/` → 의존 없음 (순수 타입 정의)
- import 경로: `@/*` alias 사용 (상대경로 지양)

## BE 핵심 패턴
- 모델 기반 클래스: `{BaseModel}` 상속 ({직렬화 규칙 설명})
- 라우터: `{라우터 패턴}(prefix="/api/{domain}")`
- 라우터 등록 순서: {domain1} → {domain2} → {domain3} → ...
- 로깅: `{로깅 패턴}`
- {도메인 특화 규칙}: {설명}

## FE 핵심 패턴
- 상태관리: `{store 패턴}`, {미들웨어/플러그인} 선택적 사용
- API 클라이언트: `{fetch 래퍼}()`로 인증 토큰 자동 주입
- i18n: {i18n 라이브러리}, `{메시지 파일 경로}`, `{사용 훅}()`
- 에러 바운더리: `{루트 에러}` + `{라우트 에러}`
- 알림: `{Toast/Notification 패턴}` — 인라인 생성 금지

## 프론트 스타일 가이드
1. UI 라우트/기능 폴더는 `styles` 폴더를 사용한다.
2. 페이지 파일의 정적 스타일은 `styles/*.module.css`로 이동한다.
3. TSX에는 구조/상태/이벤트 로직 중심으로 유지하고, 시각 규칙은 CSS Module에 둔다.
4. 동적 값(퍼센트, 좌표, 런타임 계산값)만 `style={{ ... }}`로 남긴다.
5. 전역 토큰/리셋은 `{globals_css_path}`에서만 관리한다.

## 인코딩/줄바꿈 가이드
1. 텍스트 파일은 UTF-8, 줄바꿈은 LF를 사용한다.
2. 저장소 루트의 `.gitattributes`, `.editorconfig`를 준수한다.
3. VS Code 사용 시 `.vscode/settings.json`의 인코딩 설정을 유지한다.
4. 커밋 전 `{인코딩 검증 명령}`으로 검증한다.

## 커밋 전 체크리스트
1. `{빌드 명령}` — 빌드 성공 확인
2. `{테스트 명령}` — 전체 테스트 통과
3. `{인코딩 검증 명령}` — 인코딩/줄바꿈 검증
4. BE 모델 변경 시 FE 타입 동기화 확인
5. 새 파일에 1~3줄 헤더 주석 확인
