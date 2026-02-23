# Analysis Pipeline Maintenance Guide

기준일: 2026-02-23 (KST)
대상 경로: `backend/app/services/analysis/`

## 1) 아키텍처 요약
- `AnalysisService`: timeout/fallback/logging 책임
- `EngineRegistry`: `ANALYSIS_ENGINE` 값으로 엔진 선택
- `SoundLabV57Engine`: 기본 엔진
- `RuleFallbackEngine`: 예외/타임아웃 대응 엔진
- `pipeline.py` + `steps/`: 단계형 분석 파이프라인

## 2) 파라미터 튜닝 (코드 변경 없이)
- 설정 파일: `backend/config/analysis_v57.json`
- 주로 조정하는 항목:
  - `bands`
  - `threshold`
  - `gap_fill`
  - `trim`
  - `noise_removal`
- 적용 순서:
  1. JSON 수정
  2. 백엔드 재시작
  3. 샘플 WAV 업로드로 결과 검증

## 3) 새 스텝 추가 절차
1. `backend/app/services/analysis/steps/`에 스텝 파일 추가
2. `steps/__init__.py`의 `STEP_REGISTRY`에 등록
3. `analysis_v57.json`의 `steps` 배열에 스텝 이름 추가
4. 테스트 추가 후 실행

## 4) 엔진 버전 분기 절차
1. `backend/config/analysis_vXX.json` 생성
2. `soundlab_vXX.py` 엔진 클래스 추가
3. `registry.py`에 엔진 등록
4. `.env`에서 `ANALYSIS_ENGINE=soundlab_vXX`로 전환

## 5) 점검 체크리스트
- `GET /api/jobs/{job_id}` 상태 전이 정상 (`queued -> processing -> done|failed`)
- suggestion 개수/구간/주파수 값이 비정상적으로 치우치지 않는지 확인
- fallback 발생 빈도가 급증하지 않는지 서버 로그 확인
- `backend/tests/test_analysis_harness.py` 통과 확인

## 6) 자주 발생하는 이슈
- 업로드는 성공했는데 suggestion이 0개
  - `threshold.multiplier`가 높을 수 있음
- 결과가 과도하게 많음
  - `threshold.multiplier`를 높이거나 `min_segment_duration_minutes`를 상향
- 처리 시간이 너무 김
  - timeout 값, 파일 길이, fallback 발생 여부 확인
