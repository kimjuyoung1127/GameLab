# Sprint 12.2 Close Report

기준일: 2026-02-12 (KST)  
범위: Backend API, Analysis Engine Path, Frontend Reliability, Large File Policy, Schema/Docs

## 1) 요약
- Sprint 12.2 구현 항목은 코드/마이그레이션/문서 기준으로 완료.
- Acceptance 3건은 서버/프론트 동시 기동 상태에서 실측 완료.
- 실측 후 보완 패치 반영:
  - 업로드 fast-return 복구(분석 백그라운드 처리)
  - Job 상태 전이 신뢰성 보강(`queued -> processing -> done|failed`)
  - 액션 큐 레이스 방지 및 offline queue hydrate/flush 보강
  - 대용량 업로드 메모리 사용 완화(청크 저장)

## 2) 완료 항목
### A. Backend API
- `PATCH /api/labeling/suggestions/{suggestion_id}` 구현 및 idempotent 동작 확인
- `POST /api/upload/files` fast-return 유지
- 업로드 후 분석 비동기 실행 + Job 상태 전이 반영
- `GET /api/jobs/{job_id}` 표준 payload 제공

### B. Analysis Plugin Path
- `AnalysisService -> EngineRegistry -> Engine` 구조 적용
- `AnalysisEngine.analyze(file_path, config) -> SuggestionDraft[]` 인터페이스 적용
- `SoundLabV57Engine`(stub), `RuleFallbackEngine` 구현
- `ANALYSIS_ENGINE` env 스위치 적용
- upload 경로 placeholder suggestion 제거

### C. Frontend Reliability
- `endpoints.labeling.updateSuggestionStatus(suggestionId)` 적용
- action queue(`requestId`, `suggestionId`, `targetStatus`, `clientTs`, `retryCount`) 적용
- optimistic update 유지 + serialized flush + 동일 suggestion coalesce 반영
- offline retry queue 저장/복구(hydrate) 경로 반영

### D. Large File Policy
- FE 1GB 제한 적용
- BE 1GB 제한 적용(`MAX_FILE_SIZE_MB=1024`)
- 사용자 안내 문구 반영(split/chunk, wav/mono/16kHz)

### E. Schema/Docs
- `sst_sessions`, `sst_audio_files`, `sst_suggestions`, `sst_users` DDL 추출/정리
- `docs/schema.md` 갱신
- 마이그레이션 반영:
  - `sst_suggestions.updated_at`
  - composite index `(audio_id, status)`

## 3) Acceptance Test 결과
### 3.1 핫키 스팸
- 시나리오: 동일 suggestion 대상 `confirmed` 반복(20회), `rejected -> corrected` 연속 전환
- 결과: 최종 DB 상태 `corrected` 확인
- 비고: API 실측 기준 통과. 실제 브라우저 키 입력 자동화는 후속(Playwright) 권장.

### 3.2 Upload 플로우
- `.wav` 업로드: `queued -> done`, suggestion 생성 확인
- `.m4a/.mp3` 업로드: 정상 큐잉 응답 확인
- `>1GB` 업로드: `status=failed`, `error=\"File too large\"` 확인

### 3.3 엔진 스왑
- `ANALYSIS_ENGINE=soundlab_v57`: suggestion label `Potential anomaly (SoundLab v5.7)`
- `ANALYSIS_ENGINE=rule_fallback`: suggestion label `Rule-based anomaly candidate`
- 결과: env 변경 + 재기동만으로 전환 확인
"C:\Users\ezen601\Desktop\Jason\SoundLab\frontend\src" 참조

## 4) 주요 변경 파일
- `backend/app/api/upload/router.py`
- `backend/app/api/labeling/router.py`
- `backend/app/api/jobs/router.py`
- `backend/app/services/job_manager.py`
- `backend/app/services/analysis/*`
- `backend/app/core/config.py`
- `backend/app/models/*.py`
- `frontend/src/lib/api/action-queue.ts`
- `frontend/src/lib/api/labeling.ts`
- `frontend/src/lib/api/endpoints.ts`
- `frontend/src/app/(dashboard)/upload/page.tsx`
- `frontend/src/app/(dashboard)/labeling/[id]/page.tsx`
- `frontend/src/types/*`
- `docs/schema.md`

## 5) 남은 리스크 / 다음 작업
1. FE 실제 키입력 기반 hotkey spam E2E(Playwright) 추가
2. `SoundLabV57Engine` 실 알고리즘 연동(Phase 2)
3. in-memory job store를 DB 기반으로 전환(운영 안정성)
