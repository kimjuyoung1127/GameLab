# GameLab Master Plan

기준일: 2026-02-12 (KST)
프로젝트: Smart Spectro-Tagging (GameLab)
협업 폴더: `ai-context`

## 0) 프로젝트 트리 구조

```
GameLab/
├── ai-context/                         ← 협업 문서
│   ├── START-HERE.md
│   ├── master-plan.md
│   ├── project-context.md
│   ├── sprint-close-2026-02-12.md
│   ├── claude-coding-guideline.md
│   ├── codex-review-guideline.md
│   ├── logs/
│   └── archive/
├── backend/                            ← FastAPI + Supabase
│   ├── .env
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── core/
│       │   ├── config.py
│       │   └── supabase_client.py
│       ├── models/                     ← 도메인별 모델 (1:1 미러)
│       │   ├── common.py              ↔ FE types/common.ts
│       │   ├── upload.py              ↔ FE types/upload.ts
│       │   ├── jobs.py
│       │   ├── sessions.py            ↔ FE types/sessions.ts
│       │   ├── labeling.py            ↔ FE types/labeling.ts
│       │   ├── overview.py            ↔ FE types/overview.ts
│       │   ├── leaderboard.py         ↔ FE types/leaderboard.ts
│       │   └── schemas.py             (re-export barrel)
│       ├── api/                        ← 도메인별 라우터 (1:1 미러)
│       │   ├── upload/router.py       ↔ FE lib/api/upload.ts
│       │   ├── jobs/router.py         ↔ FE lib/api/jobs.ts
│       │   ├── sessions/router.py     ↔ FE lib/api/sessions.ts
│       │   ├── labeling/router.py     ↔ FE lib/api/labeling.ts
│       │   ├── overview/router.py     ↔ FE lib/api/overview.ts
│       │   └── leaderboard/router.py  ↔ FE lib/api/leaderboard.ts
│       └── services/
│           ├── job_manager.py
│           └── analysis/
│               ├── engine.py           (AnalysisEngine ABC)
│               ├── soundlab_v57.py
│               ├── rule_fallback.py
│               ├── registry.py
│               └── service.py          (AnalysisService facade)
├── frontend/                           ← Next.js + React
│   └── src/
│       ├── types/                      ← 도메인별 타입 (1:1 미러)
│       │   ├── common.ts
│       │   ├── upload.ts
│       │   ├── sessions.ts
│       │   ├── labeling.ts
│       │   ├── overview.ts
│       │   ├── leaderboard.ts
│       │   └── index.ts               (re-export barrel)
│       ├── lib/
│       │   ├── api/                    ← 도메인별 API (1:1 미러)
│       │   │   ├── upload.ts
│       │   │   ├── jobs.ts
│       │   │   ├── sessions.ts
│       │   │   ├── labeling.ts
│       │   │   ├── overview.ts
│       │   │   ├── leaderboard.ts
│       │   │   ├── action-queue.ts     (핫키 스팸 방어 큐)
│       │   │   └── endpoints.ts        (re-export barrel)
│       │   ├── store/
│       │   │   ├── annotation-store.ts
│       │   │   ├── session-store.ts
│       │   │   ├── score-store.ts
│       │   │   └── ui-store.ts
│       │   └── hooks/
│       │       ├── use-autosave.ts
│       │       ├── use-waveform.ts
│       │       └── use-audio-player.ts
│       ├── components/
│       │   ├── layout/ (TopBar, Sidebar, DashboardShell, HotkeyHelp, UnsavedModal)
│       │   └── domain/labeling/WaveformCanvas.tsx
│       └── app/
│           ├── (auth)/login/page.tsx
│           └── (dashboard)/
│               ├── upload/page.tsx
│               ├── labeling/[id]/page.tsx
│               ├── overview/page.tsx
│               ├── sessions/page.tsx
│               └── leaderboard/page.tsx
├── docs/ (Prd.md, react.md, bone.md, schema.md, ...)
└── scripts/ (sql-chunks/, extract-and-insert.js)
```

### 1:1 미러 매핑 규칙
- `BE models/{domain}.py` ↔ `FE types/{domain}.ts`
- `BE api/{domain}/router.py` ↔ `FE lib/api/{domain}.ts`
- 도메인: upload, jobs, sessions, labeling, overview, leaderboard, common

## 1) 시작 문서 경로 (레포 루트 기준)
1. `ai-context/START-HERE.md`
2. `ai-context/master-plan.md`
3. `ai-context/project-context.md`
4. `ai-context/sprint-close-2026-02-12.md`
5. `ai-context/claude-coding-guideline.md`
6. `ai-context/codex-review-guideline.md`
7. `ai-context/logs/2026-02-12-session-log.md`

## 2) 제품 기준 문서 (Source of Truth)
1. `docs/Prd.md`
2. `docs/react.md`
3. `docs/bone.md`

## 3) 문서 경로 규칙 (재명시)
- 절대경로 금지
- 레포 루트 상대경로만 사용
- 실행 명령은 항상 `smart-spectro-tagging` 기준으로 기록
- 협업 문서 운영 기본: 작업 중에는 `ai-context/sprint-close-YYYY-MM-DD.md` + `ai-context/logs/*.md` 중심으로 갱신
- 완료된 implementation brief/handoff/worklog/review/slack/day-close 문서는 날짜 폴더로 archive 보관

## 4) 현재 단계와 목표
- 현재 단계: Phase 1.5 (Phase 2 준비)
- 목표:
  - Phase 1 완료 기능의 안정성 보강
  - 협업 문서 단일 기준 고정
  - Phase 2 진입 전 기술 부채 정리

## 5) 백로그 상태 (완료 / 진행중 / 후보)

### 완료
1. `sessions` 생성 + 목록 필터 안정화 (`3dd4329`)
2. `labeling/[id]` 3패널 UX 완성 (`639c109`)
3. Spectrogram 동적 레이어 반영 (`b7ca706`)
4. `annotation-store` undo/redo + hotkeys 연결 (`639c109`)
5. autosave + offline queue 최소 구현 (`b7ca706`)
6. leaderboard 점수 연동 (`b7ca706`)
7. 사이드바 404 링크 제거 (`3dd4329`)

### 진행중
1. ~~Tailwind 동적 클래스 purge 리스크 제거~~ ✅
2. ~~autosave 키 구조 개선(`sst-autosave-${audioId}`)~~ ✅
3. ~~협업 문서 포맷 단일화(로그/리뷰/handoff)~~ ✅

### 후보
1. SoundLab 패턴 이식(heavy/light, timeline/event-log)
2. 스펙트로그램 Canvas/WebGL PoC
3. 모바일 반응형 보강
4. Mock -> API 경계(`lib/api/endpoints.ts`) 고정

## 6) Sprint 11 (실행 순서 + 완료 기준)
1. ✅ `sprint-handoff-2026-02-11-pm.md` 인코딩/가독성 복구
2. ✅ Tailwind 동적 클래스 정적화
3. ✅ autosave 키 파일 단위 분리
4. ✅ review/worklog 포맷 정규화

5. 모바일 1차 점검
- 완료 기준: `/sessions`, `/labeling/[id]`, `/leaderboard`에서 핵심 플로우 수행 가능

## 6-1) Sprint 12.2 완료 상태 (2026-02-12)
- 완료 보고: `ai-context/sprint-close-2026-02-12.md`
- 핵심 결과:
  1. Backend API 강화(PATCH suggestion, jobs payload 표준화, upload 비동기 분석)
  2. Analysis plugin path 적용(`AnalysisService -> EngineRegistry -> Engine`)
  3. Frontend action queue 신뢰성 보강(serialize/coalesce/offline hydrate)
  4. Large file 1GB 정책 FE/BE 동시 적용
  5. schema/migration/docs 반영 완료

## 7) Phase 전환 기준
- Phase 1 -> 2 진입 조건:
  - 라벨링 코어 UX가 mock 데이터로 안정 동작
  - API 경계(`lib/api/endpoints.ts`)가 고정됨
  - 주요 화면이 모바일/데스크톱에서 깨지지 않음

## 8) 완료 보고 형식
- 변경 요약
  1. 파일/기능
  2. 핵심 로직
  3. 영향 범위
- 검증
  1. 실행 명령
  2. 결과(성공/실패 + 핵심 로그)
- 리스크
  1. 오픈 이슈
  2. 다음 작업
