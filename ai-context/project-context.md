# 프로젝트 컨텍스트 (GameLab)

기준일: 2026-02-10 (KST)
프로젝트명: Smart Spectro-Tagging

## 1) 한 줄 정의
AI가 먼저 음향 이상 구간을 제안하고, 사용자가 O/X 검증과 간단한 수정으로 빠르게 라벨링을 완료하는 협업형 음향 라벨링 플랫폼.

## 2) 왜 만드는가
- 기존 음향 라벨링은 전문가 의존도가 높고 비용/시간이 큼
- 현장 기사/비전문가가 라벨링에 참여하기 어려움
- PoC 단계에서 "빠르고 직관적인 검증 UX"가 필요함

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
- Frontend: Next.js + React + Canvas/WebGL + Web Audio API
- Backend(Phase 2): FastAPI + Python SoundLab
- DB(Phase 2): Supabase PostgreSQL
- 흐름: Audio -> AI Engine -> API -> Web App -> DB

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

## 9) API 기준 (Phase 2)
- Sessions: `POST /sessions/create`, `GET /sessions`
- Audio: `POST /audio/upload`
- AI: `POST /ai/analyze-audio`, `GET /ai/suggestions/{audioId}`
- Labeling: `POST /annotations/save`, `POST /suggestions/confirm`, `POST /suggestions/reject`
- Leaderboard: `GET /leaderboard`

## 10) 권한 초안
- `admin`: 전체
- `annotator`: 라벨링 중심
- `viewer`: 조회 전용

## 11) 비기능/운영 원칙
- Frontend-First 단계에서 mock 데이터 구조를 API 스펙과 동일하게 유지
- 저장 실패 시 offline queue 후 재시도
- Reject/Apply 직후 단기 undo UX 제공
- 문서 기준 충돌 시 `docs/Prd.md`를 최우선으로 따름

## 12) 현재 범위와 제외 범위
- 포함: 화면/상태/워크플로우 MVP, 더미 AI 연동
- 제외(후속): 실시간 AI 추론 성능 튜닝, 운영 권한 고도화, 결제/과금

## 13) SoundLab 자산 활용 원칙
- 소스: `C:\\Users\\ezen601\\Desktop\\Jason\\SoundLab\\frontend`
- 재사용 우선 항목:
  - heavy/light 분석 분리 패턴
  - Otsu 기반 동적 threshold 흐름
  - ON/OFF 세그먼트 타임라인 집계
  - 이벤트 로그 선택 -> 차트 하이라이트 연동
  - CSV export 흐름
- 직접 이식 금지 항목:
  - Streamlit UI 구조(컴포넌트/상태모델이 다름)
- 적용 방식:
  - Next.js + Zustand 구조로 재구현
  - 서비스 레이어(`analysis-service`)를 통해 알고리즘 경계 분리
