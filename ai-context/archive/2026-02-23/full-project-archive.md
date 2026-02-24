# GameLab (Smart Spectro-Tagging) 전체 개발 아카이브

기준일: 2026-02-24 (KST)
범위: Sprint 12.2 ~ Sprint 14.0
현재 Phase: 2D 진행 중 (Sprint 14.0)

---

## 1. 프로젝트 개요

### 1.1 핵심 정보
- **프로젝트명:** Smart Spectro-Tagging (GameLab)
- **목적:** IoT 기기 음향 데이터의 AI 기반 스펙트로그램 라벨링 도구
- **최종 목표:** IoT 기기 → 특징 소리값 JSON 수신 → 분석 → UI 렌더링 (별도 Sprint 예정)
- **Supabase 프로젝트:** `signalcraft` (ID: `zlcnanvidrjgpuugbcou`)
- **리전:** Seoul (`ap-northeast-2`)
- **DB:** PostgreSQL 17.6.1, ACTIVE_HEALTHY
- **협업 모델:** Claude Code(구현) + Codex(리뷰/검증)

### 1.2 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **FE 프레임워크** | Next.js | 16.1.6 |
| **FE 라이브러리** | React | 19.2.3 |
| **상태 관리** | Zustand | 5.0.11 |
| **스타일링** | Tailwind CSS | 4.x |
| **아이콘** | Lucide React | 0.563.0 |
| **i18n** | next-intl | 3.x (Sprint 13.6) |
| **BE 프레임워크** | FastAPI | 0.115.6 |
| **BE 데이터** | Supabase Python | 2.13.0 |
| **분석 엔진** | NumPy + SciPy + scikit-image + soundfile | 1.24+ / 1.11+ / 0.21+ / 0.12+ |
| **테스트** | Pytest + pytest-asyncio | 7.0+ / 0.21+ |
| **언어** | TypeScript 5.x / Python 3.12 | |

---

## 2. 데이터베이스 스키마 (현재)

### 2.1 SST 핵심 테이블 (8개)

**`sst_sessions`** (7 rows)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | text | PK |
| name | text | NOT NULL |
| device_type | text | DEFAULT 'Unknown' |
| status | text | CHECK ('pending', 'processing', 'completed') |
| file_count | integer | DEFAULT 0 |
| progress | integer | CHECK 0-100 |
| score | numeric | nullable |
| created_at | timestamptz | DEFAULT now() |

**`sst_audio_files`** (2 rows)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | text | PK |
| session_id | text | FK → sst_sessions.id |
| filename | text | NOT NULL |
| duration | text | DEFAULT '00:00:00' |
| sample_rate | text | DEFAULT 'Unknown' |
| status | text | CHECK ('pending', 'processing', 'completed', 'failed') |
| audio_url | text | nullable |
| created_at | timestamptz | DEFAULT now() |

**`sst_suggestions`** (2 rows)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | text | PK |
| audio_id | text | FK → sst_audio_files.id |
| label | text | DEFAULT 'Suggestion' |
| confidence | integer | CHECK 0-100 |
| description | text | DEFAULT '' |
| start_time | double precision | DEFAULT 0 |
| end_time | double precision | DEFAULT 0 |
| freq_low | float8 | DEFAULT 0 (Sprint 12.4: int→float) |
| freq_high | float8 | DEFAULT 0 (Sprint 12.4: int→float) |
| status | text | CHECK ('pending', 'confirmed', 'rejected', 'corrected') |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() (Sprint 12.2 추가) |

인덱스: `idx_suggestions_audio(audio_id)`, `idx_sst_suggestions_audio_status(audio_id, status)`

**`sst_users`** (5 rows)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | text | PK |
| name | text | NOT NULL |
| email | text | NOT NULL |
| role | text | DEFAULT 'junior_tagger' |
| avatar | text | nullable |
| today_score | integer | DEFAULT 0 |
| accuracy | numeric | DEFAULT 0 |
| all_time_score | integer | DEFAULT 0 |
| created_at | timestamptz | DEFAULT now() |

현재 사용자: u-1(Sarah Jenkins), u-2(Mike T.), u-3(Alex Ross), u-4(John Doe), u-5(Emily R.)

**`sst_jobs`** (Sprint 13.4 생성)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | text | PK |
| status | text | DEFAULT 'queued' |
| progress | float8 | DEFAULT 0 |
| session_id | text | FK → sst_sessions.id ON DELETE CASCADE |
| file_count | integer | nullable |
| error | text | nullable |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

인덱스: `idx_sst_jobs_session(session_id)`, `idx_sst_jobs_status(status)`
상태값: idle, uploading, queued, processing, done, failed

**`sst_achievements`** (12 rows, Sprint 13.8 생성)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | text | PK |
| name | text | NOT NULL |
| name_ko | text | NOT NULL |
| description | text | NOT NULL |
| description_ko | text | NOT NULL |
| icon | text | DEFAULT 'trophy' |
| category | text | DEFAULT 'general' |
| threshold | integer | DEFAULT 1 |
| sort_order | integer | DEFAULT 0 |
| created_at | timestamptz | DEFAULT now() |

시드 데이터: first-confirm, first-fix, ten-confirms, fifty-confirms, hundred-labels, streak-5, streak-10, score-500, score-5000, daily-goal, speed-demon, first-session

**`sst_user_achievements`** (Sprint 13.8 생성)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | text | PK (gen_random_uuid) |
| user_id | text | FK → sst_users.id ON DELETE CASCADE |
| achievement_id | text | FK → sst_achievements.id ON DELETE CASCADE |
| unlocked_at | timestamptz | DEFAULT now() |

UNIQUE(user_id, achievement_id)
인덱스: `idx_user_achievements_user(user_id)`, `idx_user_achievements_achievement(achievement_id)`

### 2.2 DB 함수
- `create_upload_session_with_files(p_session, p_files, p_suggestions)` — 원자적 업로드 트랜잭션

### 2.3 RLS 정책
- 모든 sst_* 테이블: RLS 활성화
- Sprint 12.5: DELETE 정책 추가 (sst_sessions, sst_audio_files, sst_suggestions)
- Sprint 13.4: sst_jobs에 open policy
- Sprint 13.8: sst_achievements + sst_user_achievements에 read-all + insert-all policy

---

## 3. API 엔드포인트 전체 목록

### 3.1 Upload (`/api/upload`)
```
POST /api/upload/files
  → multipart/form-data (file + device_type)
  → { jobId, sessionId, uploadedCount }
  → 비동기 분석 트리거, 1GB 파일 제한
  → 확장자 검증: .wav, .m4a, .mp3
```

### 3.2 Jobs (`/api/jobs`)
```
GET /api/jobs/{job_id}
  → JobStatusResponse { jobId, status, progress, sessionId, fileCount, error }
  → Sprint 13.4: 인메모리 → Supabase DB 전환
```

### 3.3 Sessions (`/api/sessions`)
```
GET /api/sessions              → List[SessionResponse] (created_at DESC)
GET /api/sessions/{id}/files   → List[AudioFileResponse]
DELETE /api/sessions/{id}      → 204 (Sprint 12.5: 3테이블 캐스케이드 삭제)
```

### 3.4 Labeling (`/api/labeling`)
```
GET /api/labeling/{session_id}/suggestions  → List[SuggestionResponse]
PATCH /api/labeling/suggestions/{id}        → SuggestionResponse
  → Sprint 13.5: confirmed +10점, corrected +20점 sst_users 업데이트
GET /api/labeling/{session_id}/export       → CSV/JSON StreamingResponse (Sprint 12.5)
```

### 3.5 Overview (`/api/overview`)
```
GET /api/overview/metrics → OverviewMetrics
```

### 3.6 Leaderboard (`/api/leaderboard`)
```
GET /api/leaderboard     → List[LeaderboardEntry] (today_score DESC)
GET /api/leaderboard/me  → LeaderboardEntry (인증 사용자 기준)
```

### 3.7 Achievements (`/api/achievements`, Sprint 13.8)
```
GET /api/achievements              → List[Achievement] (전체 업적 정의)
GET /api/achievements/me           → List[UserAchievement] (현재 인증 사용자 달성 업적)
POST /api/achievements/unlock      → UserAchievement (idempotent upsert)
```

---

## 4. 프론트엔드 구조

### 4.1 페이지 맵
```
/login                → OAuth 로그인 (Sprint 13.3: Supabase Auth)
/                     → 대시보드 홈
/upload               → 파일 업로드 + 잡 폴링
/labeling/[id]        → 3패널 라벨링 워크스페이스 (핵심 페이지)
/sessions             → 세션 목록 + 다중 삭제
/overview             → 대시보드 메트릭
/leaderboard          → 사용자 랭킹
```

### 4.2 Zustand 스토어 (6개)

| 스토어 | 역할 | 주요 상태 |
|--------|------|-----------|
| `session-store` | 세션/파일 관리 | currentSession, files, currentFileId |
| `annotation-store` | 라벨링 상태 | suggestions, selectedId, undo/redo |
| `score-store` | 점수+레벨+일일목표 | score, streak, allTimeScore, dailyGoal, dailyProgress (Sprint 13.7) |
| `ui-store` | UI 상태 | unsavedChanges, toastMessage, hotkeyHelpOpen (Sprint 13.6) |
| `auth-store` | 인증 상태 | user, loading (Sprint 13.9: bypass 제거) |
| `achievement-store` | 업적 관리 | all, unlocked, recentUnlock, checkAndUnlock (Sprint 13.8) |

### 4.3 커스텀 훅 (3개)

| 훅 | 역할 | 주요 기능 |
|----|------|-----------|
| `use-audio-player` | 오디오 재생 | play/pause/seek, playRegion, volume/setVolume (Sprint 13.5), localStorage 저장 |
| `use-autosave` | 자동 저장 | 2초 디바운스, unsavedChanges 플래그 |
| `use-waveform` | 파형 시각화 | AudioContext 디코딩, peaks 데이터 |

### 4.4 핫키 시스템 (Sprint 12.5 + 13.6 강화)

**Labeling 페이지 단축키:**

| 키 | 기능 | 조건 |
|----|------|------|
| Space | Play/Pause (구간 재생 인식) | Input/Textarea 제외 |
| O | Suggestion 확인 (+10점) | review 모드 |
| X | Suggestion 거부 | review 모드 |
| F | Fix 적용 (+20점) | edit 모드 |
| B | Brush 도구 | |
| R | Box 도구 | |
| S | Select 도구 | Ctrl/Cmd 아님 |
| A | Anchor 도구 | Sprint 13.6 |
| Tab / Shift+Tab | Suggestion 순환 이동 | |
| Arrow Up/Down | Suggestion 경계 이동 | |
| Ctrl+Z / Ctrl+Shift+Z | Undo / Redo | |
| + / = | 줌 인 (+0.25, 최대 3.0) | Sprint 13.6 |
| - | 줌 아웃 (-0.25, 최소 0.5) | Sprint 13.6 |
| Shift+ArrowUp/Down | 볼륨 ±10% | Sprint 13.6 |
| [ / ] | 재생 속도 ±0.25x (0.5~2.0) | Sprint 13.6 |
| Ctrl+→ / Ctrl+← | 다음/이전 파일 | Sprint 13.6 |
| Ctrl+Enter | 저장 & 다음 파일 | Sprint 13.6 |
| ? | 전체 단축키 도움말 토글 | |

**전역 네비게이션 단축키 (Sprint 13.6):**

| 키 | 페이지 |
|----|--------|
| Alt+1 | Overview |
| Alt+2 | Upload |
| Alt+3 | Sessions |
| Alt+4 | Leaderboard |

### 4.5 i18n 시스템 (Sprint 13.6)

- **라이브러리:** next-intl (cookie 기반, URL 경로 분리 없음)
- **지원 언어:** 한국어(ko, 기본), English(en)
- **번역 파일:** `frontend/messages/ko.json`, `frontend/messages/en.json`
- **네임스페이스:** common, login, overview, upload, sessions, labeling, leaderboard, sidebar, hotkeys, layout
- **총 문자열:** ~290개 × 2
- **전환 방식:** Sidebar의 LocaleSwitcher → 쿠키 설정 + router.refresh()

### 4.6 레벨 시스템 (Sprint 13.7)

| 레벨 | 이름 (ko) | 이름 (en) | 점수 범위 | 색상 |
|------|-----------|-----------|-----------|------|
| 1 | 새내기 | Rookie | 0~99 | gray |
| 2 | 견습생 | Apprentice | 100~499 | blue |
| 3 | 분석가 | Analyst | 500~1,499 | green |
| 4 | 전문가 | Expert | 1,500~4,999 | purple |
| 5 | 마스터 | Master | 5,000~14,999 | orange |
| 6 | 그랜드마스터 | Grand Master | 15,000+ | gold |

- FE 전용 계산 (`getLevel()` 순수 함수), DB 변경 없음
- Sidebar에 레벨 뱃지 + XP 진행 바 표시
- 레벨 경계 돌파 시 DashboardShell에서 토스트 표시

### 4.5 Action Queue (`action-queue.ts`, Sprint 12.2)
- 핫키 스팸 방어: 큐 직렬화, 중복 병합
- 재시도: 최대 3회, 1초 간격
- 오프라인: localStorage 저장/복원

---

## 5. 분석 파이프라인 아키텍처

### 5.1 전체 흐름
```
Upload → ffprobe 메타데이터 → 비동기 분석 → DB 저장 → FE 폴링
                                    ↓
                          AnalysisService
                          (timeout 120s + auto-fallback)
                                    ↓
                          SoundLabV57Engine
                          (JSON 설정 기반)
                                    ↓
                    ┌─────────────────────────────────────┐
                    │  7-Step Pipeline (pluggable)         │
                    │  1. LoadAudio (soundfile + ffmpeg)   │
                    │  2. FeatureExtraction (Goertzel)     │
                    │  3. OtsuThreshold (히스테리시스)      │
                    │  4. StateMachine (ON/OFF 청크)       │
                    │  5. GapFill (근접 구간 병합)          │
                    │  6. Trim (에지 제거)                  │
                    │  7. NoiseRemoval (최소 길이 필터)     │
                    └─────────────────────────────────────┘
                                    ↓
                          SuggestionDraft[] → DB insert
```

### 5.2 JSON 설정 (`backend/config/analysis_v57.json`)
```json
{
  "version": "5.7",
  "chunk_duration_sec": 5.0,
  "bands": {
    "id_wide": { "freq": 535.0, "bw": 10.0, "label": "Machine ON" },
    "surge_60": { "freq": 60.0, "bw": 2.0, "label": "Startup Surge" },
    "surge_120": { "freq": 120.0, "bw": 2.0, "label": "Startup Surge" },
    "diag_180": { "freq": 180.0, "bw": 2.0, "label": "Diagnostic Activity" }
  },
  "threshold": { "method": "otsu", "multiplier": 1.5, "hysteresis_factor": 0.8 },
  "gap_fill": { "max_gap_minutes": 2.0 },
  "trim": { "safety_buffer_sec": 60.0, "drop_ratio": 0.5, ... },
  "noise_removal": { "min_segment_duration_minutes": 1.0 },
  "steps": ["load_audio", "feature_extraction", "threshold", "state_machine", "gap_fill", "trim", "noise_removal"]
}
```

### 5.3 엔진 전환
- `ANALYSIS_ENGINE` 환경변수로 전환
- `soundlab_v57` (기본) / `rule_fallback` (폴백)
- 타임아웃 시 자동 폴백

### 5.4 테스트 하네스 (11개 통과)
- LoadAudioStep WAV 로딩
- FeatureExtractionStep 밴드 추출
- OtsuThresholdStep 임계값 계산
- StateMachineStep ON/OFF 감지
- 파이프라인 통합 (머신 ON / 무음)
- 회귀 테스트 (예상 세그먼트 수)
- 빌드 검증 (스텝 레지스트리, 미등록 스텝 에러)

---

## 6. Sprint 완료 보고 (시간순)

### Sprint 12.2 (2026-02-12) — BE API + Schema 강화

| 항목 | 상태 |
|------|------|
| PATCH `/api/labeling/suggestions/{id}` | ✅ |
| Action Queue (핫키 스팸 방어) | ✅ |
| `sst_suggestions.updated_at` 컬럼 추가 | ✅ |
| 복합 인덱스 `(audio_id, status)` | ✅ |
| 1GB 파일 제한 (FE + BE) | ✅ |
| 1:1 미러 구조 확립 (BE models ↔ FE types) | ✅ |
| `docs/schema.md` DDL 완전 추출 | ✅ |

### Sprint 12.3 (2026-02-12) — SoundLab V5.7 파이프라인

| 항목 | 상태 |
|------|------|
| PipelineStep ABC + STEP_REGISTRY + build_pipeline | ✅ |
| 7개 분석 스텝 포팅 (Goertzel, Otsu, StateMachine 등) | ✅ |
| JSON 설정 파일 `analysis_v57.json` | ✅ |
| AnalysisService timeout(120s) + auto-fallback | ✅ |
| 테스트 하네스 11개 통과 | ✅ |
| 유지보수 가이드 문서 | ✅ |

### Sprint 12.4 (2026-02-12) — E2E 연동 + 엔진 전환

| 항목 | 상태 |
|------|------|
| 기본 엔진 `soundlab_v57`로 전환 | ✅ |
| `freq_low`/`freq_high` float 타입 정렬 | ✅ |
| 분석 완료 → 세션 `status=completed` 자동 업데이트 | ✅ |
| FE 폴링 60초 확장 + labeling 재시도 | ✅ |
| 세션 초기화 순서 버그 수정 (`setFiles` 호출 순서) | ✅ |

### Sprint 12.5 (2026-02-12) — Labeling UX 강화 + 세션 관리

| 항목 | 상태 |
|------|------|
| 스페이스바 Play/Pause + Region Playback | ✅ |
| Tab/Arrow 키보드 Suggestion 이동 | ✅ |
| 파일별 진행 상황 (reviewed/total + 배지) | ✅ |
| 세션/파일 삭제 API + UI (3테이블 캐스케이드) | ✅ |
| CSV/JSON 내보내기 StreamingResponse | ✅ |
| 파일 완료 감지 + 자동 다음 이동 | ✅ |
| 다중 선택 + 일괄 삭제 | ✅ |
| DELETE 404 버그 수정 + RLS 정책 추가 | ✅ |

### Sprint 13.1 (2026-02-23) — CLAUDE.md 시스템

| 항목 | 상태 |
|------|------|
| 루트 CLAUDE.md + 18개 폴더별 CLAUDE.md 생성 (한국어) | ✅ |
| `claude-coding-guideline.md`에 "파일 직접 읽기" 규칙 추가 | ✅ |
| 분석 엔진 버전 관리 규칙 문서화 | ✅ |
| Phase 2 로드맵 수립: 2A→2B→2C→2D | ✅ |

### Sprint 13.2 (2026-02-23) — 파일 헤더 주석

| 항목 | 상태 |
|------|------|
| FE/BE 전체 파일 한국어 헤더 주석 추가 | ✅ |

### Sprint 13.3 (2026-02-23) — Supabase Auth

| 항목 | 상태 |
|------|------|
| Supabase Auth 연동 (클라이언트 + 서버 + 프록시) | ✅ |
| AuthProvider + auth-store (Zustand) | ✅ |
| 로그인 페이지 + OAuth callback | ✅ |
| `BYPASS_LOGIN` 환경변수로 개발 모드 지원 | ✅ |

새 파일: `lib/supabase/client.ts`, `server.ts`, `proxy.ts`, `src/proxy.ts`, `auth/callback/route.ts`, `auth-store.ts`, `AuthProvider.tsx`

### Sprint 13.4 (2026-02-23) — Job Store DB + Error Boundary

| 항목 | 상태 |
|------|------|
| `sst_jobs` 테이블 Supabase migration (RLS + 인덱스) | ✅ |
| `job_manager.py` 인메모리 dict → Supabase CRUD 전환 | ✅ |
| `global-error.tsx` 루트 에러 바운더리 | ✅ |
| `(dashboard)/error.tsx` 대시보드 에러 바운더리 | ✅ |
| `Toast.tsx` 글로벌 Toast 렌더러 | ✅ |
| `DashboardShell.tsx`에 `<Toast />` 추가 | ✅ |
| `docs/schema.md`에 `sst_jobs` DDL 추가 | ✅ |

### Sprint 13.5 (2026-02-23) — Non-WAV + 볼륨 + 리더보드 실데이터

| 항목 | 상태 |
|------|------|
| `load_audio.py`: scipy → soundfile + ffmpeg 폴백 (MP3/M4A/FLAC) | ✅ |
| `requirements.txt`에 `soundfile>=0.12.0` 추가 | ✅ |
| `use-audio-player.ts`: volume 상태 + setVolume + localStorage | ✅ |
| labeling page: 인터랙티브 볼륨 슬라이더 + mute/unmute | ✅ |
| `labeling/router.py`: PATCH suggestion → sst_users 점수 업데이트 | ✅ |
| `leaderboard/router.py`: `GET /api/leaderboard/me` 엔드포인트 | ✅ |
| `score-store.ts`: 하드코딩(9420) → 서버 동기화, 초기값 0 | ✅ |
| `leaderboard.ts`: `fetchMyScore()` 함수 + endpoints.me | ✅ |
| labeling page: `fetchFromServer()` 서버 점수 로드 | ✅ |

점수 규칙: confirmed +10점, corrected +20점, rejected 변동없음
데모 유저: `u-1` (Sarah Jenkins, bypass 모드)

### Sprint 13.6 (2026-02-23) — 단축키 강화 + i18n 프레임워크

| 항목 | 상태 |
|------|------|
| 10개 새 단축키 (Anchor, Zoom, Volume, Speed, File Nav, Save&Next) | ✅ |
| Alt+1~4 전역 네비게이션 (DashboardShell) | ✅ |
| HotkeyHelp: 로컬 state → ui-store 전환 + 새 섹션 | ✅ |
| Sidebar에 Keyboard 아이콘 버튼 (단축키 모달 접근) | ✅ |
| `use-audio-player.ts`: playbackRate + setPlaybackRate | ✅ |
| next-intl 설치 + 설정 (cookie 기반, URL 분리 없음) | ✅ |
| `messages/ko.json` + `messages/en.json` (~290개 × 2) | ✅ |
| root layout: NextIntlClientProvider 래핑 | ✅ |
| LocaleSwitcher 컴포넌트 (Globe 아이콘 + 쿠키 토글) | ✅ |
| 10개 페이지 문자열 추출 (하드코딩 → t() 호출) | ✅ |

신규 파일: `i18n/config.ts`, `i18n/request.ts`, `messages/ko.json`, `messages/en.json`, `LocaleSwitcher.tsx`

### Sprint 13.7 (2026-02-23) — 레벨 시스템 + 일일 목표

| 항목 | 상태 |
|------|------|
| score-store: allTimeScore, dailyGoal, dailyProgress, getLevel() | ✅ |
| 6단계 레벨 테이블 (새내기~그랜드마스터) | ✅ |
| Sidebar: 레벨 뱃지 + XP 진행 바 | ✅ |
| labeling page: Daily Goal UI 강화 (dailyProgress/dailyGoal) | ✅ |
| labeling page: confirm/fix 시 incrementDailyProgress() 호출 | ✅ |
| DashboardShell: 레벨업 토스트 감지 (useRef 비교) | ✅ |

### Sprint 13.8 (2026-02-23) — 업적/배지 시스템

| 항목 | 상태 |
|------|------|
| DB: `sst_achievements` + `sst_user_achievements` 테이블 생성 | ✅ |
| DB: 12개 업적 시드 데이터 | ✅ |
| DB: RLS + 인덱스 | ✅ |
| BE: `models/achievement.py` (Achievement, UserAchievement, UnlockRequest) | ✅ |
| BE: `api/achievements/router.py` (3개 엔드포인트) | ✅ |
| FE: `types/achievement.ts` + barrel re-export | ✅ |
| FE: `lib/api/achievement.ts` + endpoints 추가 | ✅ |
| FE: `lib/store/achievement-store.ts` (규칙 체크 엔진) | ✅ |
| labeling page: confirm/fix → checkAndUnlock() + 토스트 | ✅ |
| leaderboard page: "내 업적" 배지 그리드 UI | ✅ |

업적 규칙 체크: first-confirm, first-fix, ten-confirms, fifty-confirms, hundred-labels, streak-5, streak-10, score-500, score-5000, daily-goal

---

### Sprint 13.9 (2026-02-23) — Auth 단일화 + 안정화 핫픽스

| 항목 | 상태 |
|------|------|
| 프론트: `dev-user`/`BYPASS_LOGIN` 제거, Supabase Auth 단일 기준 전환 | ✅ |
| 프론트: `authFetch` 도입(Authorization Bearer 자동 주입) | ✅ |
| 프론트: 업적 API 네트워크 실패 안전 처리(`achievement.ts`, `achievement-store.ts`) | ✅ |
| 프론트: 로그인 페이지 OAuth 전용(구글/카카오) 정리 | ✅ |
| 프론트: hydration mismatch 수정(`DashboardShell`, `use-audio-player`) | ✅ |
| 프론트: 라벨링 완료 오버레이(“세션 목록으로 돌아가는 중…”) 클릭 dismiss 처리 | ✅ |
| 백엔드: `SUPABASE_SERVICE_ROLE_KEY` 우선 사용으로 서버 쓰기 안정화 | ✅ |
| 백엔드: `job_manager.get_job` 406/None 응답 방어 처리 + 404 안정 응답 | ✅ |
| 백엔드: 업적 unlock 전 `sst_users` 보장(bootstrap/upsert) 처리 | ✅ |
| 백엔드: `leaderboard/me`, `achievements/me` 등 현재 인증 사용자 기준으로 정렬 | ✅ |

배포 메모: 프론트는 `https://gamelab-zeta.vercel.app/` 배포 완료, 백엔드는 로컬 `uvicorn` 기반 운영/검증 중.

---

## 7. 파일 구조 (전체)

```
GameLab/
├── ai-context/
│   ├── START-HERE.md
│   ├── master-plan.md
│   ├── project-context.md
│   ├── claude-coding-guideline.md
│   ├── codex-review-guideline.md
│   ├── maintenance-analysis-pipeline.md
│   ├── logs/
│   └── archive/
│       ├── 2026-02-11/
│       ├── 2026-02-12/  (Sprint 12.2~12.5 보고서)
│       └── 2026-02-23/  (이 문서)
│
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── CLAUDE.md
│   ├── config/analysis_v57.json
│   ├── tests/
│   │   ├── test_analysis_harness.py (11개 테스트)
│   │   └── fixtures/ (합성 WAV + 기대값)
│   └── app/
│       ├── main.py
│       ├── core/
│       │   ├── config.py (Settings + Pydantic BaseSettings)
│       │   └── supabase_client.py
│       ├── models/
│       │   ├── common.py (CamelModel 베이스)
│       │   ├── upload.py, jobs.py, sessions.py
│       │   ├── labeling.py, overview.py, leaderboard.py
│       │   ├── achievement.py (Sprint 13.8)
│       │   └── schemas.py (barrel re-export)
│       ├── api/
│       │   ├── upload/router.py    (POST /files)
│       │   ├── jobs/router.py      (GET /{id})
│       │   ├── sessions/router.py  (GET, GET /files, DELETE)
│       │   ├── labeling/router.py  (GET /suggestions, PATCH, GET /export)
│       │   ├── overview/router.py  (GET /metrics)
│       │   ├── leaderboard/router.py (GET, GET /me)
│       │   └── achievements/router.py (GET, GET /me, POST /unlock, Sprint 13.9)
│       └── services/
│           ├── job_manager.py (Supabase CRUD, Sprint 13.4 전환)
│           └── analysis/
│               ├── engine.py (ABC + SuggestionDraft)
│               ├── pipeline.py (Context + Step ABC + Pipeline)
│               ├── service.py (timeout/fallback/logging)
│               ├── registry.py (엔진 팩토리)
│               ├── soundlab_v57.py (V5.7 엔진)
│               ├── rule_fallback.py (폴백 엔진)
│               └── steps/ (7개 파이프라인 스텝)
│                   ├── load_audio.py (soundfile + ffmpeg, Sprint 13.5)
│                   ├── feature_extraction.py (Goertzel)
│                   ├── threshold.py (Otsu)
│                   ├── state_machine.py
│                   ├── gap_fill.py
│                   ├── trim.py
│                   └── noise_removal.py
│
├── frontend/
│   ├── .env.local
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.ts (createNextIntlPlugin 래핑, Sprint 13.6)
│   ├── CLAUDE.md
│   ├── messages/
│   │   ├── ko.json (~290 한국어 문자열, Sprint 13.6)
│   │   └── en.json (~290 영어 문자열, Sprint 13.6)
│   └── src/
│       ├── proxy.ts (Supabase Auth 프록시, Sprint 13.3)
│       ├── i18n/
│       │   ├── config.ts (locales, defaultLocale, Sprint 13.6)
│       │   └── request.ts (getRequestConfig + cookie, Sprint 13.6)
│       ├── types/ (8개 도메인 타입 + barrel)
│       │   └── achievement.ts (Sprint 13.8)
│       ├── lib/
│       │   ├── api/ (8개 도메인 API + action-queue + barrel)
│       │   │   └── achievement.ts (Sprint 13.8)
│       │   ├── store/ (6개 Zustand 스토어)
│       │   │   └── achievement-store.ts (Sprint 13.8)
│       │   ├── hooks/ (3개 커스텀 훅)
│       │   └── supabase/ (client, server, proxy)
│       ├── components/
│       │   ├── providers/AuthProvider.tsx
│       │   ├── layout/ (TopBar, Sidebar, DashboardShell, HotkeyHelp, UnsavedModal, LocaleSwitcher)
│       │   │   └── LocaleSwitcher.tsx (Sprint 13.6)
│       │   ├── domain/labeling/WaveformCanvas.tsx
│       │   └── ui/Toast.tsx (Sprint 13.4)
│       └── app/
│           ├── layout.tsx (NextIntlClientProvider, Sprint 13.6)
│           ├── page.tsx, global-error.tsx
│           ├── auth/callback/route.ts
│           └── (dashboard)/
│               ├── layout.tsx, page.tsx, error.tsx
│               ├── upload/page.tsx
│               ├── labeling/[id]/page.tsx (1200+ lines, 핵심 기능)
│               ├── sessions/page.tsx
│               ├── overview/page.tsx
│               └── leaderboard/page.tsx (배지 그리드, Sprint 13.8)
│
├── docs/
│   ├── schema.md (전체 DDL 레퍼런스)
│   ├── Prd.md, react.md, bone.md
│   └── CLAUDE.md
│
└── scripts/ (SQL 청크)
```

---

## 8. 환경 설정

### 8.1 Backend (`backend/.env`)
```
SUPABASE_URL=https://zlcnanvidrjgpuugbcou.supabase.co
SUPABASE_ANON_KEY=...
ALLOWED_ORIGINS=http://localhost:3000
PUBLIC_FILE_BASE_URL=http://localhost:8000
MAX_FILE_SIZE_MB=1024
UPLOAD_DIR=./uploads
ALLOWED_EXTENSIONS=[".wav", ".m4a", ".mp3"]
ANALYSIS_ENGINE=soundlab_v57
ANALYSIS_TIMEOUT_SEC=120
ANALYSIS_CONFIG_DIR=./config
```

### 8.2 Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://zlcnanvidrjgpuugbcou.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 8.3 실행 명령
```bash
# Backend
cd backend
uvicorn app.main:app --reload    # http://localhost:8000

# Frontend
cd frontend
npm run dev                       # http://localhost:3000

# Tests
cd backend && python -m pytest tests/ -v
cd frontend && npm run build
```

---

## 9. 1:1 미러 구조 규칙

| BE | FE | 도메인 |
|----|----|----|
| `models/upload.py` | `types/upload.ts` | 업로드 |
| `models/jobs.py` | `types/jobs.ts` | 잡 상태 |
| `models/sessions.py` | `types/sessions.ts` | 세션/파일 |
| `models/labeling.py` | `types/labeling.ts` | 라벨링 |
| `models/overview.py` | `types/overview.ts` | 대시보드 |
| `models/leaderboard.py` | `types/leaderboard.ts` | 리더보드 |
| `models/common.py` | `types/common.ts` | 공통 |
| `models/achievement.py` | `types/achievement.ts` | 업적 (Sprint 13.8) |
| `api/{domain}/router.py` | `lib/api/{domain}.ts` | API |
| `models/schemas.py` (barrel) | `types/index.ts` (barrel) | re-export |

CamelModel(BE)이 snake_case → camelCase 자동 변환

---

## 10. Phase 2 로드맵

| Phase | 내용 | 상태 |
|-------|------|------|
| 2A | 문서화 (CLAUDE.md, 파일 헤더) | ✅ 완료 |
| 2B | 프로덕션 준비 (Auth, Job Store DB, Error Boundary) | ✅ 완료 |
| 2C | UX 개선 (Non-WAV, 볼륨, 리더보드, i18n, 단축키, 레벨, 업적) | ✅ 완료 |
| 2D | 배포 (Vercel FE + Railway BE, Sentry, Supabase Storage) | 진행 중 (Sprint 14.0) |
| IoT | IoT 기기 → JSON 특징값 수신 → 분석 → UI 렌더링 | 별도 Sprint 예정 |

### 남은 Sprint 후보
- Sprint 14: 모니터링 + E2E 테스트
- Sprint 15+: IoT JSON 파이프라인

---

## 11. 주요 통계

| 지표 | 값 |
|------|-----|
| Python 파일 수 | ~48 |
| TypeScript 파일 수 | ~60 |
| 문서 파일 수 | ~25 |
| 번역 문자열 수 | ~290 × 2 (ko/en) |
| DB 테이블 수 | 18 (SST 8개) |
| API 엔드포인트 수 | 14 |
| FE 페이지 수 | 7 |
| 분석 파이프라인 스텝 | 7 |
| Zustand 스토어 | 6 |
| 커스텀 훅 | 3 |
| 핫키 수 | 27+ (labeling) + 4 (전역) |
| 업적 수 | 12 |
| 레벨 단계 | 6 |
| 테스트 케이스 | 11 (전수 통과) |
| 적용 마이그레이션 수 | 6 |
| 커밋 수 (main) | 10+ |

---

## 12. 주의사항 / 알려진 이슈

### 반드시 기억할 것
- FE 경로: `frontend/` (NOT `smart-spectro-tagging/`)
- 문서 경로: 절대경로 금지, 레포 루트 상대경로만
- `setCurrentSessionById`가 files를 리셋하므로 `setFiles`를 뒤에 호출
- `.env`가 Pydantic BaseSettings 기본값을 override하므로 양쪽 모두 변경 필요
- 사용자 식별 기준: Supabase Auth `auth.uid()` 단일 사용 (데모 유저 제거)

### 알려진 기술 부채
1. SoundLab V5.7 일부 실 WAV에서 타임아웃/폴백 발생
2. 좁은 주파수 대역(525-545Hz) UI 가시성 미흡 (20kHz 스케일)
3. DELETE RLS 정책이 `USING (true)` — Auth 연동 시 `auth.uid()` 전환 필요
4. `today_score` 일일 리셋 메커니즘 미구현
5. 점수 업데이트가 read-then-update (원자적 increment 아님)
6. Playwright E2E 테스트 미구현
7. 업적 RLS가 open policy — Auth 연동 시 `auth.uid()` 전환 필요
8. `speed-demon` / `first-session` 업적 규칙 체크 미구현 (시드만 존재)

---

## 13. DB 마이그레이션 이력

| 순번 | 이름 | 내용 | Sprint |
|------|------|------|--------|
| 1 | `add_suggestions_updated_at` | `sst_suggestions.updated_at` 컬럼 | 12.2 |
| 2 | `add_suggestions_audio_status_index` | 복합 인덱스 `(audio_id, status)` | 12.2 |
| 3 | `add_anon_delete_policies` | 3개 테이블 DELETE RLS 정책 | 12.5 |
| 4 | `create_sst_jobs_table` | `sst_jobs` 테이블 + RLS + 인덱스 | 13.4 |
| 5 | `create_achievements_tables` | `sst_achievements` + `sst_user_achievements` + RLS + 인덱스 | 13.8 |
| 6 | `seed_achievements` | 12개 업적 시드 데이터 | 13.8 |

---

*이 문서는 GameLab 프로젝트의 Sprint 12.2~13.9까지의 전체 개발 내역을 기록합니다.*
*온보딩, 프로젝트 핸드오프, 기술 부채 추적, 배포 절차 참조용으로 사용하세요.*

---

## 14. Archive 통합 반영 (2026-02-24)

본 섹션은 `ai-context/archive/2026-02-24/session-log-2026-02-24.md` 내용을
`full-project-archive.md`에 통합한 최신 업데이트다.

### 14.1 Sprint 14.0 (2026-02-24) — Phase 2D 배포 + 라벨링 UX 고도화

| 항목 | 상태 |
|------|------|
| Railway 백엔드 배포 구성/검증 (`/health` 200) | ✅ |
| FE `NEXT_PUBLIC_API_URL` 운영 URL 갱신 | ✅ |
| 수동 라벨 생성 API (`POST /api/labeling/{session_id}/suggestions`) | ✅ |
| Suggestion 모델 확장 (`source`, `created_by`) | ✅ |
| Labeling export 확장 (CSV/JSON: source, created_by 포함) | ✅ |
| 라벨링 단축키 재정렬 (`A=Select`, `G=Snap`, `Ctrl+Enter=수동저장`) | ✅ |
| 수동 박스 이동/리사이즈 + Undo 정합성 | ✅ |
| FE lint/build 검증 | ✅ |
| main 푸시 (`5d0cd6b`) | ✅ |

### 14.2 Labeling 워크플로우 기준 (2026-02-24 이후)
- `O`: AI 제안 확정 전용
- `Ctrl+Enter`: 수동 draft 저장
- `A`: Select, `R`: Box, `G`: Snap Toggle
- 선택 모드에서 수동 박스:
  - drag move 가능
  - corner handle resize 가능
  - move/resize 1회 동작은 `Ctrl+Z` 1회로 복구

### 14.3 API 기준 추가/변경
- 추가:
  - `POST /api/labeling/{session_id}/suggestions`
- 유지:
  - `GET /api/labeling/{session_id}/suggestions`
  - `PATCH /api/labeling/suggestions/{id}`
  - `GET /api/labeling/{session_id}/export`
- 변경:
  - export payload에 `source`, `created_by` 포함

### 14.4 타입/스토어 기준 업데이트
- FE `Suggestion` 일반화: `source`, `createdBy`
- `ManualDraft`, `LoopState` 도입
- `annotation-store` 확장:
  - `manualDrafts`, `selectedDraftId`, `loopState`
  - undo/redo snapshot 범위 확장
- history 타입 확장:
  - `ai_confirm`, `manual_create`, `manual_delete`, `manual_move`, `manual_resize`

### 14.5 배포/운영 메모
- FE: Vercel (`gamelab-zeta.vercel.app`)
- BE: Railway (`gamelab-production.up.railway.app`)
- 현재 2D 상태: 배포는 반영되었고 운영 안정화(E2E/Storage/RLS hardening)는 후속 진행

### 14.6 후속 과제 (Archive 기준)
1. FE↔BE E2E 자동화 (핫키/저장/파일 전환/루프/undo 회귀)
2. `sst_suggestions.source`, `created_by` DB 마이그레이션 정식화
3. RLS open policy를 `auth.uid()` 기반으로 강화
4. Supabase Storage 영속화 및 모니터링(Sentry) 정착

### 14.7 참조
- `ai-context/archive/2026-02-24/session-log-2026-02-24.md`
- `ai-context/archive/2026-02-23/session-log-2026-02-12.md`
- `docs/architecture-diagrams.md`
