# 프로젝트 컨텍스트 (GameLab)

기준일: 2026-03-03 (KST)
프로젝트명: Smart Spectro-Tagging
현재 단계: Phase 2E 완료 (스펙트로그램 리스닝 + 분석 도구 강화)

## 1) 한 줄 정의
AI가 먼저 음향 이상 구간을 제안하고, 사용자가 검수(C/X/Shift+F)와 수동 구간 생성(Box), 스펙트로그램 분석 도구(리스닝/FFT/줌)로 라벨 결과를 완성하는 협업형 음향 라벨링 플랫폼.

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
2. Fast Review: C/X/Shift+F + 핫키 기반 빠른 검수
3. Manual Authoring: Box 기반 수동 구간 생성/이동/리사이즈
4. Spectrogram Analysis: 영역 선택 리스닝(원본/필터링) + FFT 설정 + 줌/커서
5. Light Gamification: 점수/스트릭/리더보드/레벨/업적/미션

## 5) 시스템 개요
- Frontend: Next.js 16 + React 19 + Zustand + next-intl (한/영)
- Backend: FastAPI + 분석 엔진 플러그인
- DB: Supabase PostgreSQL (RLS 활성화)
- 흐름: Upload -> Job Queue -> Analysis Engine -> Suggestions -> Labeling -> Export

## 6) 주요 화면
- 로그인 `/login`
- 대시보드 `/overview`
- 세션 목록 `/sessions`
- 라벨링 워크스페이스 `/labeling/[id]`
- 리더보드 `/leaderboard`

## 7) 핵심 도메인 모델
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
- `mission-store`: 미션/보상 상태

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

## 10) 단축키 기준 (라벨링 — 전체)
### 검수
| 키 | 동작 |
|----|------|
| `C` | 제안 확정 (review 모드) |
| `X` | 제안 거절 (review 모드) |
| `Shift+F` | 수정 적용 (edit 모드) |

### 도구
| 키 | 동작 |
|----|------|
| `A` | Select 도구 |
| `R` | Box 도구 |
| `Shift+R` | 줌 박스 모드 |
| `E` | Eraser 도구 |
| `G` | 스냅 토글 |

### 재생/리스닝
| 키 | 동작 |
|----|------|
| `Space` | 재생/일시정지 (선택 구간 우선) |
| `O` | 원본 구간 재생 |
| `F` | 필터링 구간 재생 |
| `[`/`]` | 재생 속도 ±0.25 (0.25x~2.0x) |
| `I`/`P`/`L` | 루프 시작/끝/토글 |
| `Shift+↑`/`Shift+↓` | 볼륨 ±10% |

### 뷰/줌
| 키 | 동작 |
|----|------|
| `+`/`=` | 줌 인 |
| `-` | 줌 아웃 |
| `Shift+0` | 뷰 리셋 |
| `Escape` | 줌 박스 모드 해제 |

### 탐색
| 키 | 동작 |
|----|------|
| `Tab`/`Shift+Tab` | 다음/이전 pending 제안 |
| `↑`/`↓` | 제안 목록 탐색 |
| `Ctrl+→`/`Ctrl+←` | 다음/이전 파일 |
| `Ctrl+Shift+→`/`Ctrl+Shift+←` | 다음/이전 북마크 |
| `M` | needs_analysis 북마크 |

### 편집/실행취소
| 키 | 동작 |
|----|------|
| `Ctrl+Enter` | 수동 draft 저장 |
| `Delete`/`Backspace` | 선택된 draft/제안 삭제 |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Shift+Z` | Undo All (뷰포트+어노테이션 전체) |

## 11) 스펙트로그램 분석 기능 (Sprint 14)
- 영역 선택 원본 재생 (`O`) / 필터링 재생 (`F`)
- FFT 설정 패널: 크기(512~4096), 윈도우(Hann/Hamming/Blackman), 동적 범위
- 구간 재생 커서 동기화 (녹색 세로선)
- 피치 보존 모드 (속도 변경 시 음높이 유지)
- 0.25x~2.0x 재생 속도 범위
- PNG 스크린샷 내보내기

## 12) 비기능/운영 원칙
- FE/BE 타입-모델 1:1 미러 규칙 유지
- 저장 실패 시 재시도/명확한 피드백 우선
- 라벨링 핵심 플로우 회귀 0건을 기준으로 변경 승인
- 문서 기준 충돌 시 `docs/status/PROJECT-STATUS.md` 우선 확인

## 13) 현재 범위와 제외 범위
- 포함: 업로드/세션/라벨링/리더보드, 수동 라벨, 스펙트로그램 분석 도구, export, i18n, 게이미피케이션
- 제외(후속): 운영 권한 고도화, 결제/과금, CEO 스펙 잔여 6개 항목

## 14) 참조 문서
- 프로젝트 현황: `docs/status/PROJECT-STATUS.md`
- 구조 다이어그램: `docs/architecture-diagrams.md`
- 마스터 플랜: `ai-context/master-plan.md`
