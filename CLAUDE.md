# Smart Spectro-Tagging (GameLab)

## 핵심 개발 원칙
1. 파일 수정 전 반드시 현재 파일 내용을 직접 읽고 작업한다.
2. 기존 코드(타입/훅/함수/API)를 우선 재사용하고 중복 구현을 피한다.
3. 백엔드 모델/응답 변경 시 프론트 타입/클라이언트도 1:1로 함께 갱신한다.
4. 모든 신규 코드 파일 상단에는 1~3줄 요약 주석을 둔다.
5. 하드코딩 문자열은 가능한 한 분리 가능한 구조로 유지한다.
6. 작업 시작 전 해당 폴더의 CLAUDE.md를 먼저 확인한다.

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

## 기본 구조
- `backend/`: FastAPI + Supabase
- `frontend/`: Next.js App Router + React + TypeScript
- `docs/`: 제품/스키마 문서
- `ai-context/`: 작업 컨텍스트 및 계획 문서
- `scripts/`: 공용 유틸 스크립트
