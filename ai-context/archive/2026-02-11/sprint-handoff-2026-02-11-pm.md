# Sprint Handoff (2026-02-12) - Sprint 12 실행 기준

기준일: 2026-02-12 (KST)
기준 브랜치: `main`
실행 경로: `smart-spectro-tagging`

## 1) Sprint 11 완료 상태 + 커밋 기준
- Sprint 11은 전체 완료 상태로 마감됨.
- 기준 커밋:
  1. `00bc11d` - 협업문서 정규화 + Tailwind 동적 클래스 정적화 + autosave 키 분리
  2. `6567f60` - Codex P2 잔여(leaderboard/score-store/cursor) + 모바일 반응형 1차 점검

## 2) Sprint 12 목표 / KPI
### 목표
- 비전문가(현장 사용자)가 설명 없이 업로드 -> 분석 대기 -> 라벨링 진입까지 완료 가능한 실작동 흐름 구축

### KPI
- 북극성 지표: 첫 업로드 완료율
- 스프린트 목표값: 첫 업로드 완료율 >= 85%

## 3) 확정 결정 3개
1. 우선순위: 업로드 + 온보딩
2. 백엔드 스택: FastAPI + Supabase
3. 구조 원칙: 프론트/백엔드 도메인 1:1 매칭

## 4) FE/BE 구현 범위

### 4.1 Frontend 범위
- `/overview` 페이지 실구현
- `/upload` 업로드 위저드 페이지 구현
- 로고 클릭 시 `/overview` 이동 고정
- 단축키 도움말 UI(`?`) + 최초 1회 온보딩 안내
- 업로드 실패 가이드(원인 + 재시도) 노출

### 4.2 Backend 범위 (FastAPI + Supabase)
- 업로드 API/작업 상태 API/overview 메트릭 API 구현
- 업로드 포맷 정책(`.wav`, `.m4a`, `.mp3`) 적용
- 서버 내부 분석 표준화(`wav`, `mono`, `16kHz` 기본, `44.1kHz` 운영 옵션)

### 4.3 UX 범위
- 지원 포맷/용량 제한 안내를 업로드 화면 상시 노출
- 작업 중 이탈 시 확인 모달(미저장 상태일 때)

## 5) 공개 인터페이스 / 타입 변경 (고정)

### 5.1 API
- `POST /api/upload/files`
- `GET /api/jobs/{jobId}`
- `GET /api/overview/metrics`
- `GET /api/sessions/{sessionId}/files`
- `GET /api/labeling/{sessionId}/suggestions`

### 5.2 타입
- `UploadJobStatus = "idle" | "uploading" | "queued" | "processing" | "done" | "failed"`
- `UploadResult`
- `JobStatusResponse`
- `OverviewMetrics`

## 6) 도메인 1:1 폴더 매핑 규칙

### 6.1 Frontend
- `smart-spectro-tagging/src/app/(dashboard)/overview`
- `smart-spectro-tagging/src/app/(dashboard)/upload`
- `smart-spectro-tagging/src/app/(dashboard)/sessions`
- `smart-spectro-tagging/src/app/(dashboard)/labeling`
- `smart-spectro-tagging/src/app/(dashboard)/leaderboard`

### 6.2 Backend
- `backend/app/api/overview`
- `backend/app/api/upload`
- `backend/app/api/sessions`
- `backend/app/api/labeling`
- `backend/app/api/leaderboard`
- `backend/app/api/jobs`

## 7) 업로드 입력 포맷 정책 (비개발자 친화)

목표:
- 현장/비개발자 사용자가 휴대폰 녹음 파일을 그대로 업로드할 수 있어야 한다.

지원 입력 포맷(1차):
1. `.wav` (권장)
2. `.m4a` (iPhone 기본 녹음)
3. `.mp3` (Android/메신저 공유 파일)

서버 처리 정책:
- 업로드 파일은 내부 분석 전에 표준 포맷으로 자동 변환한다.
- 표준 분석 포맷: `wav`, `mono`, `16kHz` (또는 `44.1kHz` 운영 옵션)
- 사용자에게는 "자동 변환됨" 안내를 노출하고 추가 작업을 요구하지 않는다.

유효성 검사:
- 허용 확장자 외 업로드 차단
- 최대 파일 크기 제한(예: 100MB, 운영환경에 맞게 조정)
- 변환 실패 시 원인 + 재시도 가이드 제공

## 8) Acceptance Criteria
1. `.m4a`, `.mp3`, `.wav` 업로드 모두 성공
2. 비허용 포맷 업로드 시 명확한 오류 메시지 + 재시도 가이드 노출
3. 업로드 후 `queued -> processing -> done` 상태 전이 확인
4. 분석 완료 후 `/labeling/[id]` 진입 가능
5. 로고 클릭 시 `/overview` 이동
6. 단축키 안내 패널 열기/닫기/재호출 동작

## 9) 테스트 케이스 / 시나리오
1. `.m4a` 업로드 -> 변환 -> 분석 시작
2. `.mp3` 업로드 -> 변환 -> 분석 시작
3. `.wav` 업로드 -> 분석 시작
4. 비허용 포맷 업로드 -> 명확한 오류 + 재시도 가이드
5. `npm run build` 성공
6. 로고 클릭 `/overview` 이동 + 단축키 안내 패널 동작

## 10) 리스크 / 롤백

리스크:
- 파일 변환 실패 시 업로드 완주율 저하
- job 상태 폴링 지연 시 사용자 이탈 위험

롤백 기준:
- API 실패 시 업로드 UI는 유지하되 mock fallback은 사용하지 않는다 (Supabase-only 원칙).
- 상태 전이 오류가 발생하면 jobs polling을 임시 비활성화하고 수동 재시도 제공

## 11) 실행 명령
```bash
cd smart-spectro-tagging
npm install
npm run dev
npm run build
```

## 12) 가정 / 기본값
- 타깃은 제조사 PoC(비전문가 포함) 유지
- 업로드 입력은 `wav/m4a/mp3`, 서버 내부 표준화(`wav`, `mono`, `16kHz` 기본)
- 공용 문서(`master-plan`, `worklog`, `review-log`)는 마일스톤 종료 시 일괄 반영

## 13) Supabase 인프라 마이그레이션 (✅ 완료)

### 결과
- 기존 뭄바이 프로젝트(`zigwndnmxmxctcayeavx`) → **삭제됨**
- 새 서울 프로젝트: **Signalcraft** (`zlcnanvidrjgpuugbcou`)
- 리전: **서울 (ap-northeast-2)**
- 조직: Signalcraft-2 (`mhfzddrdjeimifivexjo`)

### 마이그레이션 내역
- 12개 테이블 스키마 + RLS 정책 14개 생성 완료
- 소형 테이블 데이터 INSERT 완료 (devices 7, forecasts 7, machine_event_logs 6, maintenance_logs 8, notifications 4, notification_settings 1, daily_reports 56)
- 대형 센서 테이블(sound_logs, goertzel_test_monitor, telemetry_logs)은 스키마만 생성 (센서 재수집 대기)
- SQL 청크 파일 82개 생성 완료: `scripts/sql-chunks/` (필요 시 수동 INSERT 가능)

### 환경변수
- FE: `smart-spectro-tagging/.env.local`
- BE: `backend/.env`
- `NEXT_PUBLIC_SUPABASE_URL=https://zlcnanvidrjgpuugbcou.supabase.co`

## 14) Sprint 12 실행 순서 (Claude + Codex 협업)

### 역할 분담
- **Claude Code**: 구현 담당
- **Codex**: 리뷰/검증 전담 (`codex-review-guideline.md` 기준)

### 실행 순서
1. ✅ Supabase MCP 서버 설정 (`.mcp.json` 생성 완료)
2. ✅ Supabase 서울 리전 마이그레이션 (Signalcraft `zlcnanvidrjgpuugbcou`)
3. ✅ FE `/overview` 페이지 구현 (메트릭 카드 + 최근 세션 + Quick Actions)
4. ✅ FE `/upload` 위저드 구현 (D&D + 포맷 검증 + 에러 가이드 + 진행률)
5. ✅ Backend FastAPI 스캐폴딩 + API 구현 (5개 도메인 라우터)
6. 🟡 FE-BE 연동 (mock → 실 API) — `/upload` 실 API 호출 전환 완료, 나머지 도메인 연동 진행중
7. ✅ 온보딩 UX (단축키 도움말 `?` + 이탈 모달)

### 변경 파일 목록 (Codex 리뷰 대상)

#### FE 신규
- `smart-spectro-tagging/src/app/(dashboard)/overview/page.tsx` — Overview 대시보드
- `smart-spectro-tagging/src/app/(dashboard)/upload/page.tsx` — 업로드 위저드
- `smart-spectro-tagging/src/components/layout/HotkeyHelp.tsx` — 단축키 도움말 패널
- `smart-spectro-tagging/src/components/layout/UnsavedModal.tsx` — 이탈 확인 모달

#### FE 수정
- `smart-spectro-tagging/src/components/layout/Sidebar.tsx` — Upload 메뉴 추가, 로고→`/overview` Link
- `smart-spectro-tagging/src/components/layout/DashboardShell.tsx` — HotkeyHelp + UnsavedModal 포함
- `smart-spectro-tagging/src/app/(dashboard)/page.tsx` — redirect `/sessions` → `/overview`
- `smart-spectro-tagging/src/types/index.ts` — Sprint 12 타입 추가 (UploadJobStatus 등)
- `smart-spectro-tagging/.env.local` — 서울 Supabase 환경변수

#### Backend 신규
- `backend/app/main.py` — FastAPI 엔트리포인트 + CORS
- `backend/app/core/config.py` — Pydantic Settings
- `backend/app/core/supabase_client.py` — Supabase 클라이언트
- `backend/app/models/schemas.py` — Pydantic 모델
- `backend/app/api/upload/router.py` — `POST /api/upload/files`
- `backend/app/api/jobs/router.py` — `GET /api/jobs/{jobId}`
- `backend/app/api/overview/router.py` — `GET /api/overview/metrics`
- `backend/app/api/sessions/router.py` — `GET /api/sessions`
- `backend/app/api/labeling/router.py` — `GET /api/labeling/{sessionId}/suggestions`
- `backend/requirements.txt` — Python 의존성
- `backend/.env` — 서울 Supabase 환경변수

### 검증 결과
- `npm run build` ✅ 성공 (모든 라우트 정상 생성)
- 라우트: `/`, `/overview`, `/upload`, `/sessions`, `/labeling/[id]`, `/leaderboard`, `/login`
- `/upload` 실 API 호출 확인 (`POST /api/upload/files`), 백엔드 미실행 시 실패 메시지 노출 확인

### Codex 리뷰 요청 포인트
1. `/overview` 메트릭 계산 로직 정합성 (mock 데이터 기반)
2. `/upload` 파일 검증 로직 (확장자/크기 제한, 에러 메시지 한국어)
3. Sidebar activePath 비교 로직 (`/overview` vs `/` 구분)
4. HotkeyHelp 최초 1회 표시 + `?` 토글 + ESC 닫기
5. UnsavedModal `beforeunload` + sessionStorage 플래그 연동
6. Backend FastAPI 라우터 구조 (도메인 1:1 매핑 준수 여부)
7. 타입 정의 FE/BE 정합성 (UploadJobStatus, OverviewMetrics 등)

### 재시작 시 프롬프트
```
Sprint 12 이어서 진행. ai-context/sprint-handoff-2026-02-11-pm.md 14번 실행 순서 참고.
현재 6번(FE-BE 연동)부터 시작.
```

## 15) 사용자 작동 가이드 (현재 결과물 기준)

### 목적
- 오디오 파일 업로드 후 AI 제안을 검증(Confirm/Reject/Fix)해 라벨링 데이터를 생성한다.

### 실행 순서 (로컬)
1. 백엔드 실행
   - `cd backend`
   - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
2. 프론트 실행
   - `cd smart-spectro-tagging`
   - `npm run dev`
3. 접속
   - `http://localhost:3000`

### 로그인/진입
- 기본: 로그인 우회 ON이면 바로 대시보드 진입
- 로그인 강제 필요 시: `smart-spectro-tagging/.env.local`에 `NEXT_PUBLIC_BYPASS_LOGIN=false`

### 사용자 흐름
1. `Overview` 확인
2. `Upload` 이동
3. `.wav/.m4a/.mp3` 업로드 (최대 100MB)
4. 업로드 완료 후 `Sessions` 이동
5. 세션 선택 -> `/labeling/[id]` 진입
6. 제안 검증(Confirm/Reject/Fix) 수행

### 단축키
- `O`: Confirm
- `X`: Reject
- `F`: Apply Fix
- `S`: Select tool
- `B`: Brush
- `E`: Eraser
- `R`: Box
- `A`: Anchor
- `Ctrl+Z`: Undo
- `Ctrl+Shift+Z`: Redo
- `?`: 단축키 패널 토글
- `Esc`: 단축키 패널 닫기

### 주의사항
- 현재 파일 저장은 로컬 `UPLOAD_DIR` 기반(backend)이며 Supabase Storage 업로드는 미적용
- 프론트 API 연결을 위해 `smart-spectro-tagging/.env.local`에 `NEXT_PUBLIC_API_URL=http://localhost:8000/api` 필요

## 16) 긴급 UX 보강: 라벨링 파형/스펙트럼 가시화 (Claude 즉시 작업)

배경:
- 현재 라벨링 화면은 CSS mock 배경 기반이라 실제 오디오 근거가 부족함.
- 사용자가 어디를 라벨링해야 하는지 판단하기 어려워 정확도/신뢰도 저하 리스크가 큼.

목표:
- WebGL 완성 전이라도, 최소 실데이터 파형/시간축 기반 가시화를 즉시 제공한다.
- AI 제안 박스와 재생 커서가 동일 시간축에 정렬되도록 만든다.

구현 우선순위:
1. Waveform 미리보기(최소 기능)
2. 재생 커서와 시간축 동기화
3. AI suggestion 박스 시간 정렬 검증
4. 이후 단계로 SpectrogramCanvas(WebGL/Canvas) PoC 연결

파일별 구현 지시:
1. `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx`
- 기존 CSS mock 스펙트로그램 위에 waveform 캔버스 영역 추가
- `activeFile` 변경 시 waveform 데이터 로드 훅 호출
- 재생 상태(`isPlaying`)와 currentTime 상태를 분리 관리
- suggestion 박스 left/width 계산은 `current audio duration` 기준 유지

2. `smart-spectro-tagging/src/lib/hooks/use-waveform.ts` (신규)
- 입력: `audioUrl` 또는 `ArrayBuffer`
- 출력: downsampled peak 배열 + duration
- 구현: Web Audio API(`AudioContext.decodeAudioData`)로 샘플 추출
- 성능: 캔버스 너비 기준 다운샘플(예: 512~2048 포인트)

3. `smart-spectro-tagging/src/components/domain/labeling/WaveformCanvas.tsx` (신규)
- props: `peaks`, `currentTime`, `duration`, `onSeek(time)`
- 기능:
  - waveform 라인 렌더
  - 현재 재생 커서 렌더
  - 클릭 seek 지원(시간 이동)
  - 시간축 눈금 렌더(0%, 25%, 50%, 75%, 100%)

4. `smart-spectro-tagging/src/lib/hooks/use-audio-player.ts` (신규, 최소)
- HTMLAudioElement 래핑
- `play/pause/seek/currentTime/duration` 제공
- `requestAnimationFrame` 또는 `timeupdate`로 커서 동기화

5. `smart-spectro-tagging/src/types/index.ts`
- 필요 시 `WaveformData` 타입 추가:
  - `peaks: number[]`
  - `duration: number`
  - `sampleRate?: number`

완료 기준 (Acceptance Criteria):
1. 라벨링 화면에서 선택된 파일의 waveform이 표시된다.
2. Play 시 커서가 waveform/annotation 시간축에서 함께 이동한다.
3. waveform 클릭 시 seek 동작하고 suggestion 포커스 계산이 깨지지 않는다.
4. 파일 전환 시 waveform과 duration이 즉시 갱신된다.
5. `npm run build` 통과.

검증 시나리오:
1. `/labeling/{id}` 진입 -> 좌/중 패널에서 파일 선택 -> waveform 렌더 확인
2. 재생 버튼 클릭 -> 커서 이동 확인
3. waveform 50% 지점 클릭 -> currentTime 약 절반으로 이동 확인
4. suggestion 박스 위치가 duration 기준으로 유지되는지 확인
5. 모바일 뷰(최소 390px)에서 waveform 영역 overflow/깨짐 없음 확인

리스크/완화:
- 리스크: 대용량 파일 decode 지연
- 완화: 첫 단계는 로딩 스켈레톤 + 다운샘플 캐시(파일 ID 기준)

비고:
- 본 작업은 “근거 가시화” 최소 보강 단계이며, Phase 2 핵심인 WebGL 스펙트로그램 PoC의 선행 단계로 간주한다.

## 17) Codex 동기화 반영 (2026-02-11 15:50, Supabase 전환 전 임시 안정화)

주의:
- 본 섹션은 전환 이력이다. 현재 운영 기준은 `18) Sprint 12.1 안정화 반영`을 우선한다.

목적:
- mock 제거 이후 라벨링 진입이 막히는 구간을 즉시 복구하고, Claude가 Supabase 실데이터 전환을 이어서 할 수 있도록 브리지 상태를 고정한다.

핵심 결정:
1. 현재 단계는 `Supabase + Local fallback` 혼합 상태를 허용한다.
2. 최종 목표는 `Supabase only`이며, Local fallback은 임시 구현으로 간주한다.

### 17.1 이번 Codex 반영 범위

Backend:
- `backend/app/services/local_store.py` 신규:
  - `uploads/store.json`에 `sessions/files/suggestions` 로컬 저장
- `backend/app/api/upload/router.py`:
  - 업로드 성공 시 세션/파일/제안 메타데이터 생성
  - `sst_sessions` upsert 시도 + 실패 시 로컬 저장 유지
  - 업로드 파일 정적 접근 URL(`/uploads/...`) 생성
- `backend/app/api/sessions/router.py`:
  - `GET /api/sessions`: Supabase + Local 세션 merge 반환
  - `GET /api/sessions/{id}/files`: Local 파일 메타데이터 반환
- `backend/app/api/labeling/router.py`:
  - `GET /api/labeling/{id}/suggestions`: 세션 파일 기준 Local suggestion 반환
- `backend/app/api/jobs/router.py`:
  - `register_job`에 `session_id`, `file_count` 필드 지원
- `backend/app/api/overview/router.py`:
  - Supabase 실패 시에도 Local 세션 포함 집계
- `backend/app/api/leaderboard/router.py`:
  - Supabase 쿼리 예외 처리 추가
- `backend/app/main.py`:
  - `app.mount("/uploads", StaticFiles(...))` 추가

Frontend:
- `smart-spectro-tagging/src/types/index.ts`:
  - `AudioFile.audioUrl?: string` 추가
- `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx`:
  - `audioUrl`을 `activeFile.audioUrl`로 연결
  - duration 0 방어 적용
- `smart-spectro-tagging/src/app/(dashboard)/upload/page.tsx`:
  - API 응답 `snake_case/camelCase` 동시 수용 (`job_id`/`jobId`, `file_id`/`fileId`)
- `smart-spectro-tagging/src/app/(dashboard)/sessions/page.tsx`:
  - 상단 KPI 일부 하드코딩 제거, 세션 실데이터 기반 표시

### 17.2 현재 데이터 소스 상태 (중요)

| API | 현재 소스 | 비고 |
|---|---|---|
| `GET /api/overview/metrics` | Supabase + Local merge | 임시 혼합 |
| `GET /api/sessions` | Supabase + Local merge | 임시 혼합 |
| `GET /api/sessions/{id}/files` | Local (`uploads/store.json`) | Supabase 전환 필요 |
| `GET /api/labeling/{id}/suggestions` | Local (`uploads/store.json`) | Supabase 전환 필요 |
| `POST /api/upload/files` | 로컬 파일 + 세션 upsert 시도 | Storage/Supabase 정식화 필요 |

### 17.3 Claude 후속 작업 지시 (Supabase까지 진행 예정)

1. `sst_audio_files`, `sst_suggestions` 테이블 생성 + RLS 정책 설정
2. `GET /api/sessions/{id}/files`를 Supabase 조회로 전환
3. `GET /api/labeling/{id}/suggestions`를 Supabase 조회로 전환
4. `POST /api/upload/files`에서 Local JSON 저장 제거, Supabase + Storage 단일화
5. `backend/app/services/local_store.py` 및 Local fallback 코드 제거
6. 업로드 완료 후 생성된 `sessionId`로 즉시 `/labeling/{sessionId}` 진입 연결

완료 기준:
1. 라벨링 흐름이 Supabase 단일 소스에서 동작
2. `uploads/store.json` 의존성 제거
3. API 응답 스키마(camelCase) FE 타입과 1:1 정합
4. `npm run build` + 백엔드 실행 검증 통과

## 18) Sprint 12.1 안정화 반영 (Supabase-Only + Labeling Real-Flow)

반영 시각:
- 2026-02-11 (KST), Codex 적용

핵심 반영:
1. `audioUrl` 절대경로 규칙 적용
   - `backend/app/core/config.py`: `public_file_base_url` 추가
   - `backend/app/api/upload/router.py`: `audio_url`를 `http://localhost:8000/uploads/...` 형태로 저장
   - `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx`: 상대경로 방어 로직 추가 (`NEXT_PUBLIC_API_URL` origin 기준 보정)

2. 업로드 DB 쓰기 원자성 강화
   - `backend/app/api/upload/router.py`:
     - 우선 `rpc("create_upload_session_with_files", ...)` 호출
     - RPC 실패 시 보상 트랜잭션(역순 delete) 포함한 fallback 적용
   - SQL 함수 파일 추가:
     - `scripts/sql-chunks/create_upload_session_with_files.sql`

3. Job 상태 모델 일치화
   - `backend/app/api/jobs/router.py`: `set_job_status(...)` 추가
   - `backend/app/api/upload/router.py`:
     - `queued -> processing -> done` 상태 전이 반영
     - 실패 시 `failed` + error 기록
   - `POST /api/upload/files` 응답에 `sessionId` 포함(`UploadResult.session_id`)

4. 오류 응답 표준화(빈 배열 숨김 제거)
   - 대상:
     - `backend/app/api/sessions/router.py`
     - `backend/app/api/labeling/router.py`
     - `backend/app/api/overview/router.py`
     - `backend/app/api/leaderboard/router.py`
   - 규칙:
     - 예외 시 `HTTPException(503, detail=...)`
     - 서버 로그(`logger.exception`) 남김

5. 파일 메타데이터 하드코딩 제거
   - `backend/app/api/upload/router.py`:
     - WAV는 `wave` 모듈로 duration/sampleRate 추출
     - 가능 시 `ffprobe`로 포맷 메타데이터 추출
     - 추출값을 `sst_audio_files.duration`, `sst_audio_files.sample_rate` 저장

6. FE UX 정합성
   - `smart-spectro-tagging/src/app/(dashboard)/upload/page.tsx`:
     - `queued`는 완료 아님으로 표시
     - `done` 기준 완료 카운트
     - 업로드 완료 시 `sessionId`를 사용해 자동 `/labeling/{sessionId}` 이동
   - 오류 UI 분리(데이터 없음 vs 서버 오류):
     - `smart-spectro-tagging/src/app/(dashboard)/overview/page.tsx`
     - `smart-spectro-tagging/src/app/(dashboard)/sessions/page.tsx`
     - `smart-spectro-tagging/src/app/(dashboard)/leaderboard/page.tsx`
     - `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx`

공개 인터페이스 변경:
- `UploadResult`에 `sessionId?: string` 추가
  - FE 타입: `smart-spectro-tagging/src/types/index.ts`
  - BE 모델: `backend/app/models/schemas.py`

검증:
- `python -m compileall backend/app` 통과
- `npm run build` 통과

## 19) 오늘 마감 요약 / 내일 계획

### 19.1 오늘 협업 요약 (2026-02-11)
- Supabase-only 방향으로 업로드/세션/라벨링 데이터 플로우를 정리했다.
- mock 데이터 의존 제거를 유지하면서, 라벨링 진입/파형 표시/오류 노출 흐름을 안정화했다.
- API 스키마(camelCase)와 FE 타입 정합을 맞추고 빌드 검증을 통과했다.

### 19.2 오늘 완료 항목
1. 업로드 파일 API와 세션/제안 조회 API를 Supabase 기준으로 정리
2. `audioUrl` 절대경로 규칙 및 FE 상대경로 방어 로직 반영
3. 업로드 상태 전이(`queued -> processing -> done`)와 오류 상태(`failed`) 반영
4. 화면별 오류 UI 분리(빈 데이터 vs 서버 오류)
5. 협업 문서(handoff) 최신 상태 동기화

### 19.3 내일 예정 (우선순위 고정)
1. AI 기능 고도화
   - 업로드 파일 기반 실제 분석 파이프라인 연결
   - placeholder suggestion 제거, 모델 출력 기반 `sst_suggestions` 생성
   - confidence/start/end/freq 실데이터화
2. Vercel 배포
   - FE 배포 + BE 공개 URL/CORS/환경변수 정리
   - 업로드/라벨링/파형/오류 시나리오 배포 환경 검증

### 19.4 내일 시작 프롬프트 (복붙)
`Sprint 12.1 이어서 진행. ai-context/sprint-handoff-2026-02-11-pm.md의 18, 19 섹션 기준으로 시작. 우선 AI 제안 생성 로직을 placeholder에서 실추론 기반으로 전환하고, 이어서 Vercel 배포 및 실서버 점검까지 완료.`
