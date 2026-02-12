# Sprint 12.4 Close Report

기준일: 2026-02-12 (KST)
범위: FE ↔ BE E2E 워크플로우 통합 (업로드 → 분석 → DB → FE 조회/표시)

## 1) 요약
- Sprint 12.3에서 완성된 BE 분석 파이프라인을 FE와 **E2E 연동** 완료.
- 실제 WAV 업로드 → SoundLab V5.7 분석 → sst_suggestions INSERT → labeling 페이지 suggestion 박스 표시 확인.
- 세션 초기화 순서 버그(files 리셋) 발견 및 수정.
- 디버그 로그 패턴으로 FE 데이터 흐름 문제 추적 방법 확립.

## 2) 완료 항목

### A. BE 기본 분석 엔진 전환
- `backend/app/core/config.py`: 기본값 `rule_fallback` → `soundlab_v57`
- `backend/.env`: `ANALYSIS_ENGINE=soundlab_v57`
- auto-fallback 경로(timeout/예외) 유지

### B. freq_low/freq_high 타입 정렬
- `backend/app/models/labeling.py`: `int` → `float` (DB float8 컬럼 일치)
- `backend/app/api/labeling/router.py`: `_row_to_response()` 내 `int()` → `float()`
- FE는 이미 `number` 타입이라 영향 없음

### C. 분석 완료 후 세션 상태 업데이트
- `backend/app/api/upload/router.py`: `_run_analysis_jobs()` 완료 시 `sst_sessions.status = "completed"` 업데이트
- DB 검증: 최신 세션 status=completed 확인

### D. FE 업로드 폴링 시간 확장
- `frontend/src/app/(dashboard)/upload/page.tsx`: 폴링 6회/1초 → 30회/2초 (총 60초)
- SoundLab V5.7 분석이 6초 이상 걸리는 경우 대응

### E. FE 라벨링 페이지 제안 자동 재시도
- `frontend/src/app/(dashboard)/labeling/[id]/page.tsx`: suggestions 0건 시 3초 간격 최대 5회 재시도
- useEffect cleanup으로 메모리 누수 방지

### F. 세션 초기화 순서 버그 수정 (Critical)
- **문제**: `setFiles(filesData)` 후 `setCurrentSessionById(sessionId)` 호출 시 files가 `[]`로 리셋됨
- **원인**: `setCurrentSessionById`가 `files: [], currentFileId: null`을 덮어쓰기
- **수정**: 호출 순서 변경 → `setCurrentSessionById` → `setFiles` (files가 마지막에 설정)
- **효과**: labeling 페이지에서 파일 목록 + suggestion 정상 로드 확인

## 3) Acceptance Test 결과
| 테스트 | 결과 |
|--------|------|
| BE 테스트 하네스 11개 | PASSED |
| FE `next build` TypeScript 컴파일 | PASSED |
| 실제 WAV 업로드 → DB 세션/파일/suggestion 생성 | PASSED |
| labeling 페이지 suggestion 박스 렌더링 | PASSED |
| 세션 status=completed 업데이트 | PASSED |

## 4) 주요 변경 파일
- `backend/app/core/config.py` (기본 엔진 전환)
- `backend/.env` (ANALYSIS_ENGINE=soundlab_v57)
- `backend/app/models/labeling.py` (freq 타입 float)
- `backend/app/api/labeling/router.py` (freq 변환 float)
- `backend/app/api/upload/router.py` (세션 status 업데이트)
- `frontend/src/app/(dashboard)/upload/page.tsx` (폴링 확장)
- `frontend/src/app/(dashboard)/labeling/[id]/page.tsx` (재시도 + 순서 수정)

## 5) 남은 리스크 / 다음 작업
1. SoundLab V5.7 실 WAV에서 fallback 발생 가능 — BE 로그 모니터링 필요
2. 좁은 주파수 대역(525-545Hz)이 20kHz 스펙트로그램에서 매우 가늘게 보임 → zoom 기능 필요
3. 대용량 파일(>5분) 성능 프로파일링 (Numba JIT 도입 검토)
4. Non-WAV 포맷 네이티브 분석 (librosa/soundfile)
5. In-memory job store → DB 전환
6. Playwright E2E 핫키 스팸 테스트
