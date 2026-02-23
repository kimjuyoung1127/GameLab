# Smart Spectro-Tagging (GameLab)

AI가 먼저 이상 소음 구간을 찾아 표시하고, 사용자는 O/X로 검증 후 브러시로 수정하는 음향 라벨링 플랫폼.

## 필수 코딩 규칙

1. **파일 직접 읽기 필수.** 수정 전 반드시 Read 도구로 파일 내용을 읽을 것. 절대 추측하지 말 것.
2. **기존 코드 재사용 우선.** 함수/유틸/패턴을 먼저 검색하고 재사용. 중복 구현 금지.
3. **1:1 미러 구조 유지.** BE 모델 변경 시 FE 타입도 반드시 동시 변경.
4. **파일 헤더 주석 필수.** 모든 새 코드 파일 상단에 1-3줄 한국어 기능 설명 주석.
5. **하드코딩 문자열 금지.** i18n 키로 분리 (Phase 2C 이후 적용).
6. **폴더 CLAUDE.md 먼저 읽기.** 해당 폴더의 CLAUDE.md를 먼저 확인한 후 코딩 시작.

## 프로젝트 구조

```
GameLab/
├── ai-context/          ← 협업 문서 (마스터 플랜, 가이드라인, 스프린트 기록)
├── backend/             ← FastAPI + Supabase (Python)
├── frontend/            ← Next.js + React (TypeScript)
├── docs/                ← 제품 기준 문서 (PRD, wireframe, schema)
├── scripts/             ← 빌드/배포 스크립트
└── masterpaln.md        ← 초기 기획서 (레거시, 참고용)
```

## 1:1 미러 구조

BE와 FE는 도메인별로 1:1 대응:

| 도메인 | BE 모델 | FE 타입 | BE 라우터 | FE API |
|--------|---------|---------|-----------|--------|
| upload | `models/upload.py` | `types/upload.ts` | `api/upload/router.py` | `lib/api/upload.ts` |
| jobs | `models/jobs.py` | — | `api/jobs/router.py` | `lib/api/jobs.ts` |
| sessions | `models/sessions.py` | `types/sessions.ts` | `api/sessions/router.py` | `lib/api/sessions.ts` |
| labeling | `models/labeling.py` | `types/labeling.ts` | `api/labeling/router.py` | `lib/api/labeling.ts` |
| overview | `models/overview.py` | `types/overview.ts` | `api/overview/router.py` | `lib/api/overview.ts` |
| leaderboard | `models/leaderboard.py` | `types/leaderboard.ts` | `api/leaderboard/router.py` | `lib/api/leaderboard.ts` |

## 환경변수

| 파일 | 주요 변수 |
|------|-----------|
| `backend/.env` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANALYSIS_ENGINE`, `ANALYSIS_TIMEOUT_SEC` |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BYPASS_LOGIN` |

## 분석 엔진 버전 관리

- 현재 기본 엔진: `soundlab_v57` (V5.7)
- V5.7은 **baseline** — 삭제/수정 금지
- 새 엔진은 별도 파일로 생성 후 `registry.py`에 등록
- `.env`의 `ANALYSIS_ENGINE` 값으로 전환
- 모든 엔진은 `SuggestionDraft` 포맷으로 출력 통일
- 상세: `backend/app/services/analysis/CLAUDE.md` 참조

## 핵심 문서 읽기 순서

1. `ai-context/master-plan.md` — 전체 로드맵
2. `ai-context/project-context.md` — 비즈니스 맥락
3. `ai-context/claude-coding-guideline.md` — 구현 규칙
4. `docs/Prd.md` — 제품 요구사항

## Supabase 인프라

- 프로젝트: Signalcraft (`zlcnanvidrjgpuugbcou`)
- 리전: 서울 (ap-northeast-2)
- 16개 테이블 + RLS 전체 활성화
