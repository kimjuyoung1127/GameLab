# 프로젝트 컨텍스트 (GameLab)

기준일: 2026-02-24 (KST)
프로젝트명: Smart Spectro-Tagging
현재 단계: Phase 2D 진행 중

## 1) 한 줄 정의
AI가 먼저 음향 이상 구간을 제안하고, 사용자가 검수(O/X/F)와 수동 구간 생성(Box)으로 라벨 결과를 완성하는 협업형 음향 라벨링 플랫폼.

## 2) 왜 만드는가
- 기존 음향 라벨링은 전문가 의존도가 높고 비용/시간이 큼
- 현장 기사/비전문가도 실무 라벨링에 참여 가능한 UX가 필요
- PoC 단계에서 빠르고 명확한 검수/수정/생성 플로우가 핵심

## 3) 대상 사용자
- 제조사 음향/품질 담당자
- 현장 엔지니어(비전문가 포함)
- 데모/PoC 평가자

## 4) 핵심 UX 컨셉 (현재)
1. AI Co-Pilot: AI가 이상 구간 선제안
2. Fast Review: O/X/F + 핫키 기반 빠른 검수
3. Manual Authoring: Box 기반 수동 구간 생성/이동/리사이즈
4. Light Gamification: 점수/스트릭/리더보드

## 5) 시스템 개요
- Frontend: Next.js + React + Zustand
- Backend: FastAPI + 분석 엔진 플러그인
- DB: Supabase PostgreSQL
- 흐름: Upload -> Job Queue -> Analysis Engine -> Suggestions -> Labeling -> Export

## 6) 주요 화면
- 로그인 `/login`
- 대시보드 `/overview`
- 세션 목록 `/sessions`
- 라벨링 워크스페이스 `/labeling/[id]`
- 리더보드 `/leaderboard`

## 7) 핵심 도메인 모델 (업데이트)
- Session: id, name, deviceType, status, progress, score
- AudioFile: id, sessionId, duration, sampleRate, status, audioUrl
- Suggestion: label, confidence, start/end time, freq band, status, `source(ai|user)`, `createdBy`
- ManualDraft(FE): 사용자 임시 구간(저장 전)
- SessionScore: confirmCount, fixCount, totalScore, streak

## 8) 상태관리 기준
- `session-store`: currentSession, files, currentFileId
- `annotation-store`: mode/tool/suggestions/manualDrafts/loopState/undo-redo
- `score-store`: score/streak/dailyGoal/progress
- `ui-store`: modal/loading/toast/hotkeyHelp
- `achievement-store`: 업적 상태

## 9) API 기준 (현재 구현)
- Upload: `POST /api/upload/files`
- Jobs: `GET /api/jobs/{job_id}`
- Sessions: `GET /api/sessions`, `GET /api/sessions/{session_id}/files`
- Labeling:
  - `GET /api/labeling/{session_id}/suggestions`
  - `POST /api/labeling/{session_id}/suggestions` (수동 구간 생성)
  - `PATCH /api/labeling/suggestions/{suggestion_id}`
  - `GET /api/labeling/{session_id}/export?format=csv|json`
- Overview: `GET /api/overview/metrics`
- Leaderboard: `GET /api/leaderboard`, `GET /api/leaderboard/me`

## 10) 단축키 기준 (라벨링 핵심)
- `O`: AI 제안 확정
- `X`: AI 제안 거절
- `F`: 수정 적용
- `A`: Select
- `R`: Box
- `G`: Snap Toggle
- `I / P / L`: Loop start / end / toggle
- `Ctrl+Enter`: 수동 draft 저장
- `Ctrl+Z / Ctrl+Shift+Z`: Undo / Redo

## 11) 비기능/운영 원칙
- FE/BE 타입-모델 1:1 미러 규칙 유지
- 저장 실패 시 재시도/명확한 피드백 우선
- 라벨링 핵심 플로우 회귀 0건을 기준으로 변경 승인
- 문서 기준 충돌 시 최신 archive + `docs/architecture-diagrams.md` 우선 확인

## 12) 현재 범위와 제외 범위
- 포함: 업로드/세션/라벨링/리더보드 실 API 플로우, 수동 라벨 저장, 이동/리사이즈, export
- 제외(후속): 엣지 리사이즈 고도화, 운영 권한 고도화, 결제/과금

## 13) 참조 문서
- 최신 상세 로그: `ai-context/archive/2026-02-24/session-log-2026-02-24.md`
- 누적 이력: `ai-context/archive/2026-02-23/full-project-archive.md`
- 구조 다이어그램: `docs/architecture-diagrams.md`
