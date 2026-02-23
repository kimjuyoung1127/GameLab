# 프로젝트 컨텍스트 (GameLab)

기준일: 2026-02-23 (KST)
프로젝트명: Smart Spectro-Tagging
현재 단계: Phase 2D 진행 중

## 1) 한 줄 정의
AI가 먼저 음향 이상 구간을 제안하고, 사용자가 O/X 검증과 간단한 수정으로 빠르게 라벨링을 완료하는 협업형 음향 라벨링 플랫폼.

## 2) 왜 만드는가
- 기존 음향 라벨링은 전문가 의존도가 높고 비용/시간이 큼
- 현장 기사/비전문가가 라벨링에 참여하기 어려움
- PoC 단계에서 빠르고 직관적인 검증 UX가 필요함

## 3) 대상 사용자
- 제조사 음향/품질 담당자
- 현장 엔지니어(비전문가 포함)
- 데모/PoC 평가자

## 4) 핵심 UX 컨셉
1. AI Co-Pilot: AI가 이상 구간 선제안
2. Tinder UX: O/X로 빠른 검증
3. Magnetic Brush: 대충 칠해도 자동 보정
4. Light Gamification: 점수/스트릭/리더보드

## 5) 시스템 개요
- Frontend: Next.js + React + Zustand
- Backend: FastAPI + 분석 엔진 플러그인 구조
- DB: Supabase PostgreSQL
- 흐름: Audio Upload -> Job Queue -> Analysis Engine -> Suggestions -> Labeling

## 6) 주요 화면
- 로그인 `/login`
- 대시보드 `/`
- 세션 목록 `/sessions`
- 라벨링 워크스페이스 `/labeling/[id]`
- 리더보드 `/leaderboard`

## 7) 핵심 도메인 모델
- Session: id, name, deviceType, status, progress, score
- AudioFile: id, sessionId, duration, sampleRate, status
- Suggestion(AI): label, confidence, start/end time, freq band, status
- Annotation(User): source(AI/USER/CORRECTED), geometry, label
- SessionScore: confirmCount, fixCount, totalScore, streak

## 8) 상태관리 기준
- `session-store`: currentSession, files, currentFileId
- `annotation-store`: mode/tool/suggestions/annotations/undo-redo
- `score-store`: score/streak/addScore
- `ui-store`: modal/loading/toast/offlineQueue

## 9) API 기준 (현재 구현)
- Upload: `POST /api/upload/files`
- Jobs: `GET /api/jobs/{job_id}`
- Sessions: `GET /api/sessions`, `GET /api/sessions/{session_id}/files`
- Labeling: `GET /api/labeling/{session_id}/suggestions`, `PATCH /api/labeling/suggestions/{suggestion_id}`
- Overview: `GET /api/overview/metrics`
- Leaderboard: `GET /api/leaderboard`

## 10) 권한 초안
- `admin`: 전체
- `annotator`: 라벨링 중심
- `viewer`: 조회 전용

## 11) 비기능/운영 원칙
- Frontend/Backend 타입-모델 1:1 미러 규칙 유지
- 저장 실패 시 offline queue 후 재시도
- Reject/Apply 직후 단기 undo UX 제공
- 대용량 파일 제한 FE/BE 동시 정책 적용(1GB)
- 문서 기준 충돌 시 `docs/Prd.md`를 최우선으로 따름

## 12) 현재 범위와 제외 범위
- 포함: 업로드(비동기 분석)/세션/라벨링/리더보드 실 API 플로우, 엔진 스위치, 삭제 API, 내보내기(CSV/JSON), 라벨링 UX 단축키, 스키마 문서 동기화
- 제외(후속): 실 SoundLab V5.7 실 WAV fallback 원인 고도화, 운영 권한 고도화, 결제/과금

## 13) SoundLab 자산 활용 원칙
- 재사용 우선 항목:
  - heavy/light 분석 분리 패턴
  - Otsu 기반 동적 threshold 흐름
  - ON/OFF 세그먼트 타임라인 집계
  - 이벤트 로그 선택 -> 차트 하이라이트 연동
  - CSV export 흐름
- 직접 이식 금지 항목:
  - Streamlit UI 구조(컴포넌트/상태 모델이 다름)
- 적용 방식:
  - Next.js + Zustand 구조로 재구현
  - 서비스 레이어(`analysis-service`)로 알고리즘 경계 분리

## 14) 2026-02-12 완료 기준 상태
- Suggestion 상태 업데이트 API(idempotent) 반영
- Upload fast-return + 백그라운드 분석 처리 반영
- Job 상태 전이 표준화(`queued -> processing -> done|failed`)
- `ANALYSIS_ENGINE` 환경변수 스왑 검증 완료
- Acceptance(핫키 스팸/API 기준, 업로드 플로우, 엔진 스왑) 실측 완료
