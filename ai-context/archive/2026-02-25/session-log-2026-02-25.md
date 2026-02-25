# Session Log - 2026-02-25 (KST)

## 1) Summary
- Scope: Labeling workspace refactor + 협업 구조 분석/구현 + Export 버그 수정 + DB 자동 정리 + Supabase Storage 전환 + 주파수 대역 필터링
- Result: 세션 소유자 추적, Export 필터 고도화, 수동 라벨 export 자동저장, pg_cron 기반 DB 자동 정리, 오디오 파일 Supabase Storage 이전, 스펙트로그램 주파수 범위 필터링 완료

---

## 2) Session A — Labeling Workspace Refactor

### A-1. Labeling workspace structural refactor
- Main route reduced from monolithic render to component composition:
  - `LabelingHeader`, `FileListPanel`, `ToolBar`, `SpectrogramPanel`, `PlayerControls`, `AnalysisPanel`
- Interaction-heavy logic extracted to feature-local hooks:
  - `hooks/useDraftInteractions.ts`
  - `hooks/useSuggestionInteractions.ts`
- `page.tsx` reduced to orchestration level (about 796 lines after refactor).

### A-2. Component contract alignment
- Existing component files under `labeling/[id]/components` were updated to match current runtime behavior and i18n usage.
- Toolbar/player/right-panel props were redefined to reflect current UX actions (save/export/loop/bookmark/review actions).

### A-3. CSS dead class cleanup
- `frontend/src/app/(dashboard)/labeling/[id]/styles/page.module.css`
  - Removed old dead classes.
  - Kept minimal placeholder-only file for future scoped module usage.

### A-4. Build/lint blocking issue fix
- `frontend/src/components/domain/labeling/SpectrogramCanvas.tsx`
  - Fixed function declaration order issue that caused lint/type error.

### A-5. Documentation hardening
- Updated and clarified route guidance docs:
  - `frontend/src/app/(dashboard)/labeling/CLAUDE.md`
  - `frontend/src/app/(dashboard)/labeling/[id]/CLAUDE.md`
- Rewrote both as valid UTF-8 documents after corruption detection.

---

## 3) Session B — 협업 구조 분석 + Export 고도화 + 세션 소유자

### B-1. 멀티유저 협업 구조 분석
- `sst_sessions`, `sst_audio_files`에 user_id 컬럼 없음 확인
- 모든 RLS 정책이 `qual="true"` (완전 개방) 확인
- 세션/파일/제안 CRUD에 소유자 확인 로직 부재 확인

### B-2. DB — 세션 소유자 컬럼 추가
- Supabase migration `add_sessions_user_id`: `ALTER TABLE sst_sessions ADD COLUMN user_id text;`
- `docs/schema.md` DDL 업데이트
- `docs/architecture-diagrams.md` ERD에 `user_id` 추가

### B-3. BE — 업로드 시 user_id 저장 + 세션 삭제 보호
- `backend/app/core/auth.py`: `get_optional_current_user()` 함수 추가 (BYPASS_LOGIN 호환)
- `backend/app/api/upload/router.py`: optional auth + 세션 payload에 `user_id` 저장
- `backend/app/api/sessions/router.py`:
  - `list_sessions()`: `user_id` 필드 포함
  - `delete_session()`: 소유자 확인 (403 반환)

### B-4. BE — Export status 필터 파라미터 추가
- `backend/app/api/labeling/router.py:213-253`:
  - `status` 쿼리 파라미터 추가 (`?status=confirmed,corrected`)
  - `.in_("status", statuses)` 필터링
  - 파일명에 `-labeled` suffix 추가

### B-5. FE — 타입/API 동기화
- `frontend/src/types/sessions.ts`: `userId?: string | null` 추가
- `frontend/src/lib/api/labeling.ts`: `export()` 함수에 `filters?: { status?: string }` 옵션 추가
- `backend/app/models/sessions.py`: `user_id: Optional[str] = None` 추가

### B-6. FE — ToolBar Export 드롭다운 (4개 옵션)
- `frontend/src/app/(dashboard)/labeling/[id]/components/ToolBar.tsx`:
  - `<a download>` 2개 → 드롭다운 메뉴 4개 (전체 CSV/JSON + 라벨링 완료 CSV/JSON)
  - `ChevronDown` 아이콘, outside-click-to-close
  - `LABELED_STATUS = "confirmed,corrected"` 상수

### B-7. FE — 세션 목록 소유자 표시
- `frontend/src/app/(dashboard)/sessions/page.tsx`:
  - `useAuthStore` 연동
  - `session.userId === currentUserId` 일 때 "내 세션" 배지 표시

### B-8. i18n 메시지 추가 (Session B)
- `frontend/messages/ko.json`: `exportMenu`, `exportAllCsv`, `exportAllJson`, `exportLabeledCsv`, `exportLabeledJson`, `mySession` (6개)
- `frontend/messages/en.json`: 동일 6개 키

---

## 4) Session C — Export 빈 데이터 버그 수정 + DB 자동 정리

### C-1. Export 빈 데이터 원인 진단
- **원인 1**: `R`키로 그린 수동 라벨은 로컬 메모리(annotation-store)에만 존재, DB 미저장
  - Ctrl+Enter 또는 "수동 저장" 버튼 필요 → 사용자가 누르지 않은 상태에서 export
- **원인 2**: "라벨링 완료" export는 `?status=confirmed,corrected` 필터 사용
  - 수동 라벨은 `status='pending'`으로 저장 → 필터에서 제외
- **원인 3**: DB 현재 상태 — 1 AI suggestion(pending), 0 user suggestion

### C-2. BE — Export "labeled" 필터에 수동 라벨 포함
- `backend/app/api/labeling/router.py:246-252`:
  - `.in_("status", statuses)` → `.or_(f"status.in.({status_csv}),source.eq.user")`
  - 수동 라벨(source='user')은 status에 관계없이 "라벨링 완료"에 포함

### C-3. FE — Export 클릭 시 미저장 드래프트 자동 저장
- `frontend/src/app/(dashboard)/labeling/[id]/components/ToolBar.tsx`:
  - `<a download>` → `<button onClick>` 변경
  - `handleExport()`: 미저장 드래프트 있으면 `onSaveManualDrafts()` await 후 다운로드
  - `pendingDraftCount` prop 추가 → 드롭다운 상단에 경고 배너 표시
  - `saving` 상태로 저장 중 진행 표시
  - `onSaveManualDrafts` 타입: `() => void` → `() => Promise<void>`
- `frontend/src/app/(dashboard)/labeling/[id]/page.tsx`:
  - `onSaveManualDrafts={handleSaveManualDrafts}` (async 직접 전달)
  - `pendingDraftCount={manualDrafts.length}` prop 추가

### C-4. i18n 메시지 추가 (Session C)
- `frontend/messages/ko.json`: `exportUnsavedWarning`, `exportSavingDrafts` (2개)
- `frontend/messages/en.json`: 동일 2개 키

### C-5. DB 자동 정리 — pg_cron 스케줄러
- Supabase migration `enable_pg_cron_and_cleanup`:
  - `pg_cron` 확장 활성화
  - `cleanup_old_sessions(retention_days)` 함수 생성 (cascade 삭제)
  - 3개 cron job 등록:

| Job | 스케줄 | 내용 |
|-----|--------|------|
| `weekly-session-cleanup` | 일요일 03:00 UTC | 30일 지난 completed 세션 cascade 삭제 |
| `daily-job-cleanup` | 매일 04:00 UTC | 7일 지난 sst_jobs 삭제 |
| `weekly-cron-log-cleanup` | 일요일 05:00 UTC | cron 실행 로그 7일치만 보관 |

### C-6. DB 데이터 축적 구조 분석
- 현재 DB 사용량: ~800KB (Free Plan 500MB의 0.16%)
- 매일 5세션 기준 DB 한도 도달 예상: ~3.5년+
- 디스크(`./uploads/`) 파일이 가장 큰 비용 요인 → 세션 삭제 API cascade로 제거

---

## 5) Git History (today)
- `42d9e7a` refactor(labeling): split workspace into panels and interaction hooks
- `5d7c9d3` chore(labeling): remove dead route css module classes
- `3a15a38` docs(labeling): add 2026-02-25 archive and recover guideline encoding
- `770cb78` feat: labeling 패널 분리 + 북마크/툴바 강화 + BE 세션 삭제 개선
- `fc91145` docs: 스펙트로그램 주파수 스케일 + 가로 스크롤 개발 예정 플랜 추가
- `cfc45b0` feat: Supabase Storage 전환 + 스펙트로그램 주파수 대역 필터링
- `d12cd1c` feat: 업로드 비동기 처리 — 전역 폴링 + 진행 표시기

## 6) Verification
- `cd frontend && npm run build` — Pass (Session A~D 모두)
- `cd backend && python -m pytest tests/ -v` — 11/11 Pass
- Supabase `cron.job` 테이블: 3건 등록 확인
- Supabase `sst-audio` 버킷: 생성 + RLS 정책 3개 확인
- Supabase advisor: 보안/성능 이슈 없음

## 7) Files Added/Updated

### Session A (Refactor)
- Added:
  - `frontend/src/app/(dashboard)/labeling/[id]/hooks/useDraftInteractions.ts`
  - `frontend/src/app/(dashboard)/labeling/[id]/hooks/useSuggestionInteractions.ts`
- Updated:
  - `frontend/src/app/(dashboard)/labeling/[id]/page.tsx`
  - `frontend/src/app/(dashboard)/labeling/[id]/components/*`
  - `frontend/src/components/domain/labeling/SpectrogramCanvas.tsx`
  - `frontend/src/app/(dashboard)/labeling/[id]/styles/page.module.css`
  - `frontend/src/app/(dashboard)/labeling/CLAUDE.md`
  - `frontend/src/app/(dashboard)/labeling/[id]/CLAUDE.md`

### Session B (협업 구조)
- Updated:
  - `backend/app/core/auth.py` — `get_optional_current_user()` 추가
  - `backend/app/api/upload/router.py` — optional auth + user_id 저장
  - `backend/app/api/sessions/router.py` — user_id 조회 + 삭제 보호
  - `backend/app/api/labeling/router.py` — export status 필터
  - `backend/app/models/sessions.py` — user_id 필드
  - `frontend/src/types/sessions.ts` — userId 필드
  - `frontend/src/lib/api/labeling.ts` — export filters 옵션
  - `frontend/src/app/(dashboard)/labeling/[id]/components/ToolBar.tsx` — export 드롭다운
  - `frontend/src/app/(dashboard)/sessions/page.tsx` — 소유자 배지
  - `frontend/messages/ko.json` — 6개 키 추가
  - `frontend/messages/en.json` — 6개 키 추가
  - `docs/schema.md` — sst_sessions.user_id DDL
  - `docs/architecture-diagrams.md` — ERD user_id
- Supabase migrations:
  - `add_sessions_user_id`

### Session C (Export 버그 + DB 정리)
- Updated:
  - `backend/app/api/labeling/router.py` — export `.or_()` 필터 (source=user 포함)
  - `frontend/src/app/(dashboard)/labeling/[id]/components/ToolBar.tsx` — 자동저장 + 경고
  - `frontend/src/app/(dashboard)/labeling/[id]/page.tsx` — async prop + pendingDraftCount
  - `frontend/messages/ko.json` — 2개 키 추가
  - `frontend/messages/en.json` — 2개 키 추가
- Supabase migrations:
  - `enable_pg_cron_and_cleanup`

## 8) Notes
- pg_cron은 DB 데이터만 정리 → Supabase Storage 파일은 세션 삭제 API 통해 자동 제거
- RLS 정책 강화(`true` → `auth.uid()`)는 Phase 2D 향후 작업으로 보류
- `sst_suggestions.reviewed_by` + `reviewed_at` 컬럼 추가도 향후 작업

---

## 9) Session D — Supabase Storage 전환 + 주파수 대역 필터링

> 피드백 출처: 김민교 ("오디오 파일이 계속 fail to load", "주파수를 원하는 대역으로 잘라서 볼 수 있어야")

### D-1. Supabase Storage 버킷 생성
- Supabase migration `create_sst_audio_bucket`:
  - `sst-audio` 퍼블릭 버킷 (1GB 제한, 오디오 MIME 타입만 허용)
  - RLS 정책 3개: public SELECT, service-role INSERT, service-role DELETE

### D-2. BE — 업로드 Storage 전환
- `backend/app/api/upload/router.py`:
  - `_build_audio_url()` 제거 → `_upload_to_storage()` 신규 함수
  - `MIME_MAP` 추가 (.wav/.mp3/.m4a/.flac)
  - 업로드 흐름: 로컬 임시 저장 → 메타데이터 추출 → Supabase Storage 업로드 → public URL DB 저장
  - `_run_analysis_jobs()`: 분석 완료 후 로컬 임시 파일 자동 삭제

### D-3. BE — 세션 삭제 Storage 연동
- `backend/app/api/sessions/router.py`:
  - 디스크 파일 삭제 → `supabase.storage.from_("sst-audio").remove()` 전환
  - URL에서 storage key 추출 (`/sst-audio/` 이후 경로)

### D-4. BE — config 정리
- `backend/app/core/config.py`: `upload_dir` → `temp_upload_dir`, `public_file_base_url` 삭제
- `backend/app/main.py`: `StaticFiles("/uploads")` 마운트 제거
- `backend/.env`: `UPLOAD_DIR` → `TEMP_UPLOAD_DIR`

### D-5. FFT 렌더러 주파수 범위 슬라이싱
- `frontend/src/lib/audio/spectrogram-renderer.ts`:
  - `SpectrogramOptions`에 `freqMin?`/`freqMax?` 추가
  - `computeSpectrogram()`: Hz→bin 변환 후 `[binMin, binMax]` 범위만 ImageData 출력
  - 반환값에 `binMin`/`binMax` 추가

### D-6. Web Worker + Hook 확장
- `frontend/src/lib/audio/spectrogram-worker.ts`: input/output에 `freqMin`/`freqMax` 추가
- `frontend/src/lib/hooks/use-spectrogram.ts`: `freqMin`/`freqMax` 파라미터 추가, 의존성 배열 반영

### D-7. UI — 주파수 범위 프리셋 버튼
- `frontend/src/app/(dashboard)/labeling/[id]/page.tsx`:
  - `freqMin`/`freqMax` 상태 추가
  - `suggestionBoxStyle()`: 주파수 범위 기준 좌표 계산으로 수정
- `frontend/src/app/(dashboard)/labeling/[id]/components/SpectrogramPanel.tsx`:
  - 프리셋 버튼 4개: 전체(0-max), 저대역(0-5k), 중대역(1k-8k), 고대역(5k-max)
  - 주파수 축 라벨 `freqMin`~`freqMax` 범위 동적 표시

### D-8. i18n 메시지 추가 (Session D)
- `frontend/messages/ko.json`: `freqPresetFull`, `freqPresetLow`, `freqPresetMid`, `freqPresetHigh` (4개)
- `frontend/messages/en.json`: 동일 4개 키

### D-9. 배포 환경변수 정리
- **Vercel (FE)**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`
- **Fly.io (BE)**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `TEMP_UPLOAD_DIR`, `ANALYSIS_ENGINE`
- `PUBLIC_FILE_BASE_URL` 삭제됨, `UPLOAD_DIR` → `TEMP_UPLOAD_DIR` 변경됨

---

### Session D — Files Updated
- Updated:
  - `backend/app/api/upload/router.py` — Storage 업로드 + 임시 파일 클린업
  - `backend/app/api/sessions/router.py` — Storage 파일 삭제
  - `backend/app/core/config.py` — `temp_upload_dir` 리네임
  - `backend/app/main.py` — StaticFiles 마운트 제거
  - `backend/app/core/CLAUDE.md` — 설정 문서 갱신
  - `frontend/src/types/common.ts` — `SpectrogramData.freqMin/freqMax`
  - `frontend/src/lib/audio/spectrogram-renderer.ts` — 주파수 범위 슬라이싱
  - `frontend/src/lib/audio/spectrogram-worker.ts` — Worker input/output 확장
  - `frontend/src/lib/hooks/use-spectrogram.ts` — `freqMin/freqMax` 파라미터
  - `frontend/src/app/(dashboard)/labeling/[id]/page.tsx` — 주파수 상태 + suggestionBoxStyle
  - `frontend/src/app/(dashboard)/labeling/[id]/components/SpectrogramPanel.tsx` — 프리셋 UI + 축 라벨
  - `frontend/messages/ko.json` — 4개 키 추가
  - `frontend/messages/en.json` — 4개 키 추가
- Supabase migrations:
  - `create_sst_audio_bucket`

---

## 10) Session E — 업로드 비동기 처리 (백그라운드 분석)

> 요청: "업로드 중에 자리를 비우거나 다른 작업을 할 수 있는 비동기 처리"

### E-1. 현황 분석
- BE는 이미 `asyncio.create_task()`로 분석을 백그라운드 실행 (HTTP 응답 즉시 반환)
- FE 업로드 페이지가 `pollJobStatus()` 최대 60초 블로킹 → 사용자가 페이지 이탈 불가
- 분석 상태가 로컬 `useState`에만 존재 → 페이지 이동 시 소실

### E-2. Zustand 업로드 스토어
- `frontend/src/lib/store/upload-store.ts` (**신규**)
  - `UploadJob` 인터페이스 (jobId, fileId, filename, sessionId, status, progress)
  - `persist` 미들웨어 — 브라우저 새로고침에도 상태 유지
  - `addJobs`, `updateJob`, `removeJob`, `clearCompleted`, `toggleCollapsed` 액션

### E-3. 전역 폴링 훅
- `frontend/src/lib/hooks/use-upload-polling.ts` (**신규**)
  - 활성 잡(queued/processing)이 있으면 3초 간격 폴링
  - 활성 잡 없으면 폴링 정지 (리소스 절약)
  - 완료/실패 전환 시 `showToast()` 알림

### E-4. 전역 진행 표시기
- `frontend/src/components/ui/UploadProgress.tsx` (**신규**)
  - DashboardShell에 마운트 — 모든 대시보드 페이지에서 표시
  - 화면 우하단 고정, 접기/펼치기 토글
  - 파일별 프로그레스 바 + 상태 아이콘
  - 완료 시 "라벨링 열기" 링크, 실패 시 에러 메시지

### E-5. 업로드 페이지 수정
- `frontend/src/app/(dashboard)/upload/page.tsx`:
  - `pollJobStatus()` 함수 삭제 (60초 블로킹 제거)
  - `handleUpload()`: POST 응답 후 스토어에 job 등록 → 파일 목록 초기화 → 토스트 표시
  - 사용자는 즉시 다른 페이지로 이동 가능
  - `ApiJobStatusResponse` 인터페이스 삭제 (폴링 훅으로 이동)

### E-6. DashboardShell 마운트
- `frontend/src/components/layout/DashboardShell.tsx`:
  - `<UploadProgress />` 추가 (Toast 옆)

### E-7. i18n 메시지 추가 (Session E)
- `frontend/messages/ko.json`: `upload.backgroundMsg` + `uploadProgress` 섹션 (8개 키)
- `frontend/messages/en.json`: 동일 8개 키

### Session E — Files
- Added:
  - `frontend/src/lib/store/upload-store.ts` — Zustand 업로드 잡 스토어
  - `frontend/src/lib/hooks/use-upload-polling.ts` — 전역 폴링 훅
  - `frontend/src/components/ui/UploadProgress.tsx` — 전역 진행 표시기
- Updated:
  - `frontend/src/app/(dashboard)/upload/page.tsx` — 블로킹 폴링 제거, 스토어 연동
  - `frontend/src/components/layout/DashboardShell.tsx` — UploadProgress 마운트
  - `frontend/messages/ko.json` — upload.backgroundMsg + uploadProgress 섹션
  - `frontend/messages/en.json` — 동일

---

## 11) 개발 예정 플랜 — 스펙트로그램 주파수 스케일 수정 + 가로 스크롤 확대

> 피드백 출처: 협업자 ("주파수 스케일이 맞나요?", "옆으로 늘리는 기능도 있었으면")

### Part A: 주파수 축 스케일 버그 수정

**문제**: Web Audio API `AudioContext.decodeAudioData()`가 시스템 기본 SR(48kHz)로 리샘플링하여 Y축이 24kHz로 표시됨. 실제 오디오는 8kHz까지만 올라감.

```
원본: 16kHz SR → Nyquist 8kHz
  ↓ AudioContext 리샘플
decoded.sampleRate = 48,000 → maxFreq = 24kHz
  ↓ Y축 라벨
24kHz, 18kHz, 12kHz, 6kHz, 0Hz  ← 피드백과 일치
```

**수정 계획**:

| Step | 파일 | 변경 |
|------|------|------|
| A-1 | `frontend/src/lib/hooks/use-waveform.ts` | `targetSampleRate` 파라미터 추가, `AudioContext({ sampleRate })` 옵션으로 리샘플링 방지 |
| A-2 | `frontend/src/app/(dashboard)/labeling/[id]/page.tsx` | 호출부에 `activeFile.sampleRate` 전달 + `effectiveMaxFreq` 계산에 DB 원본 SR 우선 사용 |

**핵심**: 파일마다 다른 sample rate를 가지므로 DB의 `sst_audio_files.sample_rate` 값을 기준으로 Y축 동적 적용.

### Part B: 가로 스크롤/확대 (Audacity 스타일)

**문제**: 현재 줌은 CSS `transform: scale()`만 있고 가로 스크롤이 없어 긴 파일이 좁은 폭에 압축됨.

**수정 계획**:

| Step | 파일 | 변경 |
|------|------|------|
| B-1 | `SpectrogramPanel.tsx` | `overflow-hidden` → `overflow-x-auto`, CSS transform 대신 `width: zoomLevel * 100%` 직접 확장 |
| B-2 | `ToolBar.tsx` | 줌 범위 1.0~10.0 (기존 0.5~3.0), step 0.5 |
| B-3 | `SpectrogramPanel.tsx` | 웨이브폼 섹션도 동일 너비 적용하여 가로 정렬 유지 |
| B-4 | `SpectrogramPanel.tsx` | 재생 시 커서가 뷰포트 밖으로 나가면 자동 스크롤 (선택) |

**접근**: 컨테이너 너비 자체를 확장하여 브라우저 네이티브 스크롤바 사용. `%` 기반 오버레이(커서/제안박스)는 자동 비례 확장.

### 예상 영향도

- FE만 변경 (BE 수정 없음)
- 수정 파일 4개: `use-waveform.ts`, `page.tsx`, `SpectrogramPanel.tsx`, `ToolBar.tsx`
- 기존 기능(드래프트, 제안 드래그/리사이즈, 북마크) 모두 `%` 기반이므로 호환 유지
