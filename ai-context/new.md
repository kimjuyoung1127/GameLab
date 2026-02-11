# Claude Code 작업 내역 (2026-02-11 PM ~ 현재)

기준 브랜치: `main`
기준 스프린트: Sprint 12 (핸드오프 14번 실행 순서)

---

## 1. 긴급 UX 보강: 라벨링 파형/스펙트럼 가시화 (핸드오프 Section 16)

### 배경
- 라벨링 화면이 CSS mock gradient 배경만 있어 실제 오디오 근거 부족
- 사용자가 어디를 라벨링해야 하는지 판단 불가 → 정확도/신뢰도 저하 리스크

### 신규 파일 3개

#### `smart-spectro-tagging/src/lib/hooks/use-waveform.ts`
- Web Audio API 기반 waveform 디코딩 훅
- `audioUrl`이 null(mock 모드)이면 synthetic peaks 자동 생성
- 실 URL이면 `AudioContext.decodeAudioData`로 Float32Array → 1024포인트 다운샘플
- 에러 시 synthetic fallback 제공

#### `smart-spectro-tagging/src/lib/hooks/use-audio-player.ts`
- HTMLAudioElement 래핑 + mock 모드 rAF 시뮬레이션
- API: `play()`, `pause()`, `toggle()`, `seek(time)`, `currentTime`, `duration`, `isPlaying`
- `audioUrl` null이면 `requestAnimationFrame` 기반 가상 재생
- `audioUrl` 있으면 실제 `HTMLAudioElement` 재생 + rAF로 `currentTime` 동기화

#### `smart-spectro-tagging/src/components/domain/labeling/WaveformCanvas.tsx`
- Canvas 2D 기반 waveform 바 렌더링
- 재생된 구간은 보라색(`BAR_PLAYED_COLOR`), 미재생은 인디고(`BAR_COLOR`)
- 시간축 눈금 4분할 (00:00, 25%, 50%, 75%, 100%)
- 흰색 커서 라인 + 상단 dot
- 클릭 → `onSeek(time)` 콜백으로 seek 지원
- `requestAnimationFrame` 루프로 매 프레임 리드로

### 수정 파일 2개

#### `smart-spectro-tagging/src/types/index.ts`
- `WaveformData` 인터페이스 추가: `{ peaks: number[]; duration: number; sampleRate?: number }`

#### `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx`
- **import 변경**: `useRef` 제거, `useWaveform`, `useAudioPlayer`, `WaveformCanvas` 추가
- **상태 제거**: `isPlaying`, `playbackPct`, `rafRef`, `lastTimeRef` 로컬 상태 삭제
- **훅 연결**: `useAudioPlayer(audioUrl, parsedDuration)` + `useWaveform(audioUrl, parsedDuration)`
- **파생값**: `playbackPct = (player.currentTime / totalDuration) * 100`
- **rAF 시뮬레이션 useEffect 삭제**: 기존 30줄 → `useAudioPlayer` 내부로 이동
- **레이아웃 변경**: 스펙트로그램 영역을 `flex flex-col`로 변경
  - 상단: WaveformCanvas (h-20, shrink-0)
  - 하단: 기존 스펙트로그램 gradient + annotation 박스
- **플레이어 컨트롤**: `setIsPlaying` → `player.toggle`, `isPlaying` → `player.isPlaying`
- **타임코드**: `(playbackPct / 100) * totalDuration` → `player.currentTime` 직접 사용

### 검증
- `npm run build` ✅ 통과
- 9개 라우트 정상 생성

---

## 2. Overview + Leaderboard: mock 제거 → 실 API + Supabase 전환

### 배경
- Overview, Leaderboard 페이지가 `@/lib/mock/data`의 하드코딩 데이터 사용
- 실제 백엔드 API → Supabase 쿼리로 전환 필요

### Supabase 마이그레이션

#### 마이그레이션: `create_sst_domain_tables`
```sql
CREATE TABLE sst_sessions (
  id text PRIMARY KEY,
  name text NOT NULL,
  device_type text NOT NULL DEFAULT 'Unknown',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed')),
  file_count integer NOT NULL DEFAULT 0,
  progress integer NOT NULL DEFAULT 0
    CHECK (progress >= 0 AND progress <= 100),
  score numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sst_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'junior_tagger',
  avatar text,
  today_score integer NOT NULL DEFAULT 0,
  accuracy numeric NOT NULL DEFAULT 0,
  all_time_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
- RLS 활성화 + anon read/insert/update 정책 (PoC 단계)

#### 시드 데이터
- `sst_sessions`: 5개 세션 (기존 mock과 동일 데이터)
  - SES-2049 ~ SES-2045
- `sst_users`: 5명 유저 (기존 mock과 동일 데이터)
  - Sarah Jenkins, Mike T., Alex Ross, John Doe, Emily R.

### Backend 변경

#### `backend/app/models/schemas.py`
- `CamelModel` 베이스 클래스 신규 추가
  - `alias_generator=to_camel` → 모든 응답 자동 camelCase 직렬화
  - `populate_by_name=True` → Python 코드에서는 snake_case 사용 가능
- 모든 기존 모델(`UploadResult`, `JobStatusResponse`, `OverviewMetrics`) → `CamelModel` 상속으로 변경
- `SessionResponse` 모델 신규 추가
- `LeaderboardEntry` 모델 신규 추가

#### `backend/app/api/overview/router.py`
- 하드코딩 메트릭 제거
- `supabase.table("sst_sessions").select("*")` 쿼리
- completed/processing 필터 → 집계 계산

#### `backend/app/api/sessions/router.py`
- 빈 배열 반환 제거
- `supabase.table("sst_sessions").select("*").order("created_at", desc=True)` 쿼리
- `SessionResponse` 모델로 매핑

#### `backend/app/api/leaderboard/router.py` (신규)
- `GET /api/leaderboard` 엔드포인트
- `supabase.table("sst_users").select("*").order("today_score", desc=True)` 쿼리
- `LeaderboardEntry` 모델로 매핑

#### `backend/app/main.py`
- `leaderboard_router` import + `app.include_router(leaderboard_router)` 추가

### Frontend 변경

#### `smart-spectro-tagging/src/app/(dashboard)/overview/page.tsx`
- `ApiOverviewMetrics` 인터페이스 제거
- `mapMetrics()` 함수 제거
- API 응답을 `OverviewMetrics`로 직접 캐스팅 (BE가 camelCase 반환)

#### `smart-spectro-tagging/src/app/(dashboard)/leaderboard/page.tsx`
- (Codex가 `endpoints` 기반으로 전환 완료)
- BE가 camelCase 반환하므로 `User` 타입과 직접 매핑

#### 삭제된 파일
- `smart-spectro-tagging/src/lib/hooks/use-api.ts` — 미사용으로 삭제

### 검증
- `npm run build` ✅ 통과
- 9개 라우트 정상 생성

---

## 3. 전체 변경 파일 목록

### 신규 생성
| 파일 | 설명 |
|------|------|
| `smart-spectro-tagging/src/lib/hooks/use-waveform.ts` | Web Audio API waveform 디코딩 훅 |
| `smart-spectro-tagging/src/lib/hooks/use-audio-player.ts` | HTMLAudioElement 래핑 훅 |
| `smart-spectro-tagging/src/components/domain/labeling/WaveformCanvas.tsx` | Canvas 기반 waveform 렌더 컴포넌트 |
| `backend/app/api/leaderboard/router.py` | 리더보드 API 엔드포인트 |

### 수정
| 파일 | 변경 요약 |
|------|-----------|
| `smart-spectro-tagging/src/types/index.ts` | `WaveformData` 타입 추가 |
| `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx` | waveform 통합, rAF 시뮬레이션 → useAudioPlayer 전환 |
| `smart-spectro-tagging/src/app/(dashboard)/overview/page.tsx` | snake_case 매퍼 제거, camelCase 직접 매핑 |
| `backend/app/models/schemas.py` | CamelModel 베이스 + SessionResponse + LeaderboardEntry |
| `backend/app/api/overview/router.py` | 하드코딩 → Supabase sst_sessions 쿼리 |
| `backend/app/api/sessions/router.py` | 빈 배열 → Supabase sst_sessions 쿼리 |
| `backend/app/main.py` | leaderboard_router 등록 |

### Supabase 마이그레이션
| 이름 | 내용 |
|------|------|
| `create_sst_domain_tables` | sst_sessions + sst_users 테이블 + RLS + 시드 데이터 |

---

## 4. API 엔드포인트 현황

| 메서드 | 경로 | 데이터 소스 | 상태 |
|--------|------|-------------|------|
| GET | `/api/overview/metrics` | sst_sessions 집계 | ✅ Supabase 실데이터 |
| GET | `/api/sessions` | sst_sessions | ✅ Supabase 실데이터 |
| GET | `/api/leaderboard` | sst_users | ✅ Supabase 실데이터 |
| POST | `/api/upload/files` | 로컬 파일시스템 | ✅ 구현 완료 |
| GET | `/api/jobs/{jobId}` | 인메모리 | 🟡 mock 상태 |
| GET | `/api/sessions/{id}/files` | — | 🟡 빈 배열 (sst_audio_files 테이블 미생성) |
| GET | `/api/labeling/{id}/suggestions` | — | 🟡 stub |

---

## 5. Codex 리뷰 요청 포인트

1. **CamelModel alias_generator**: `to_camel` 함수가 모든 엣지케이스를 커버하는지 (예: `id` → `id`, `avg_accuracy` → `avgAccuracy`)
2. **useAudioPlayer mock 모드**: rAF 시뮬레이션에서 `setIsPlaying(false)` → 재생 종료 시 상태 일관성
3. **WaveformCanvas rAF 루프**: 매 프레임 full redraw — 성능 최적화 필요 여부 (현재 1024 bars)
4. **Supabase RLS 정책**: PoC 단계 `USING (true)` — 프로덕션 전 auth 기반 정책으로 교체 필요
5. **sst_sessions/sst_users 시드 데이터**: 기존 mock과 동일한 값 — 실운영 데이터 스키마 정합성
6. **labeling/[id]/page.tsx 구조**: waveform + spectrogram 이중 래퍼 div 추가 — 모바일 레이아웃 파손 여부

---

## 6. 다음 작업 후보

1. `sst_audio_files` 테이블 생성 + `GET /api/sessions/{id}/files` 실데이터 전환
2. `GET /api/labeling/{id}/suggestions` 실데이터 전환
3. `GET /api/jobs/{jobId}` Supabase 기반 job 추적
4. `audioUrl` 실제 Supabase Storage URL로 교체 (waveform 실데이터 연결)
5. WaveformCanvas 성능 최적화 (offscreen canvas / 캐싱)
