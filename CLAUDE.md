# Smart Spectro-Tagging (GameLab)

## 핵심 개발 원칙
1. 파일 수정 전 반드시 현재 파일 내용을 직접 읽고 작업한다.
2. 기존 코드(타입/훅/함수/API)를 우선 재사용하고 중복 구현을 피한다.
3. 백엔드 모델/응답 변경 시 프론트 타입/클라이언트도 1:1로 함께 갱신한다.
4. 모든 신규 코드 파일 상단에는 1~3줄 요약 주석을 둔다.
5. 하드코딩 문자열은 가능한 한 분리 가능한 구조로 유지한다.
6. 작업 시작 전 해당 폴더의 CLAUDE.md를 먼저 확인한다.

## 빠른 시작
- FE: `cd frontend && npm install && npm run dev` (port 3000)
- BE: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload` (port 8000)
- 테스트: `cd backend && python -m pytest tests/ -v`
- 빌드: `cd frontend && npm run build`
- 린트: `cd frontend && npm run lint`

## 기본 구조
- `backend/`: FastAPI + Supabase (Python, Pydantic)
- `frontend/`: Next.js 16 App Router + React 19 + TypeScript + Zustand
- `docs/`: 제품/스키마 문서
- `ai-context/`: 작업 컨텍스트 및 계획 문서 (읽기 순서: START-HERE.md → master-plan.md)
- `scripts/`: 공용 유틸 스크립트

## 환경 변수
- FE: `frontend/.env.local` (`NEXT_PUBLIC_` 접두사 필수)
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_URL` (기본: `http://localhost:8000/api`)
  - `NEXT_PUBLIC_BYPASS_LOGIN` (개발용: `true`)
- BE: `backend/.env` (Pydantic BaseSettings 기본값을 override — 양쪽 모두 변경 필요)
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `ANALYSIS_ENGINE` (기본: `soundlab_v57`)
  - `ANALYSIS_TIMEOUT_SEC` (기본: `120`)

## BE ↔ FE 미러 구조
- `backend/app/models/{domain}.py` ↔ `frontend/src/types/{domain}.ts`
- `backend/app/api/{domain}/router.py` ↔ `frontend/src/lib/api/{domain}.ts`
- 도메인: upload, jobs, sessions, labeling, overview, leaderboard, common, achievement
- barrel re-export: `schemas.py` / `index.ts` / `endpoints.ts`
- BE 모델 변경 시 FE 타입 반드시 동시 갱신

## FE 레이어 규칙
- `app/` → components, lib, types, i18n 의존 가능
- `components/` → lib, types, i18n 의존 가능
- `lib/` → types만 의존 (app/components 절대 import 금지)
- `types/` → 의존 없음 (순수 타입 정의)
- import 경로: `@/*` alias 사용 (상대경로 지양)

## BE 핵심 패턴
- 모든 모델은 `CamelModel` 상속 (`snake_case` → `camelCase` 자동 변환)
- 라우터: `APIRouter(prefix="/api/{domain}", tags=["{domain}"])`
- 등록 순서: upload → jobs → overview → sessions → labeling → leaderboard → achievements
- 로깅: `logger = logging.getLogger(__name__)`, `exception()`으로 에러 기록
- 분석 엔진: V5.7 baseline 보호(삭제/수정 금지), 새 엔진은 별도 파일 + `registry.py` 등록

## FE 핵심 패턴
- Zustand store: `create<State>()` 패턴, `persist` 미들웨어 선택적 사용
- API 클라이언트: `authFetch()` 래퍼로 Bearer 토큰 자동 주입
- i18n: next-intl 쿠키 기반, `messages/{locale}.json`, `useTranslations()` 훅
- 에러 바운더리: `global-error.tsx` (루트) + `(dashboard)/error.tsx` (대시보드)
- Toast: `useUIStore().showToast()` 사용 — 인라인 Toast 생성 금지

## 프론트 스타일 가이드 (필수)
1. UI 라우트/기능 폴더는 `styles` 폴더를 사용한다.
2. 페이지 파일(`page.tsx`, `error.tsx` 등)의 정적 스타일은 `styles/*.module.css`로 이동한다.
3. TSX에는 구조/상태/이벤트 로직 중심으로 유지하고, 시각 규칙은 CSS Module에 둔다.
4. 동적 값(퍼센트, 좌표, 런타임 계산값)만 `style={{ ... }}`로 남긴다.
5. 전역 토큰/리셋은 `frontend/src/app/globals.css`에서만 관리한다.

## 인코딩/줄바꿈 가이드 (Windows 포함)
1. 텍스트 파일은 UTF-8, 줄바꿈은 LF를 사용한다.
2. 저장소 루트의 `.gitattributes`, `.editorconfig`를 준수한다.
3. VS Code 사용 시 `.vscode/settings.json`의 인코딩 설정을 유지한다.
4. 커밋 전 `node scripts/check-utf8.mjs` 또는 `cd frontend && npm run check:encoding`으로 검증한다.

## 커밋 전 체크리스트
1. `cd frontend && npm run build` — 빌드 성공 확인
2. `cd backend && python -m pytest tests/ -v` — 전체 테스트 통과
3. `node scripts/check-utf8.mjs` — 인코딩/줄바꿈 검증
4. BE 모델 변경 시 FE 타입 동기화 확인
5. 새 파일에 1~3줄 헤더 주석 확인
