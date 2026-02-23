# Analysis — 분석 엔진 서브시스템 (플러그인 아키텍처)

## 아키텍처 개요

```
AnalysisService (facade)
├── EngineRegistry (이름 -> 엔진 매핑)
│   ├── SoundLabV57Engine (기본, baseline)
│   ├── RuleFallbackEngine (비상 폴백)
│   └── (향후 V6.0+ 추가)
└── Pipeline Framework
    ├── PipelineStep ABC
    └── STEP_REGISTRY (7개 스텝)
```

## 파일 목록

| 파일 | 설명 |
|---|---|
| `engine.py` | `AnalysisEngine` ABC + `SuggestionDraft` 출력 타입 |
| `registry.py` | 엔진 등록/조회 (`_ENGINES` 딕셔너리) |
| `service.py` | `AnalysisService` facade: timeout 120초 + auto-fallback |
| `soundlab_v57.py` | SoundLab V5.7 엔진 구현 (기본 baseline) |
| `rule_fallback.py` | 규칙 기반 비상 폴백 엔진 |
| `pipeline.py` | `AnalysisContext` + `PipelineStep` ABC + `AnalysisPipeline` |
| `steps/` | 7개 파이프라인 스텝 (아래 참조) |

## steps/ 파이프라인 스텝

| 파일 | 스텝명 | 설명 |
|---|---|---|
| `__init__.py` | - | `STEP_REGISTRY` + `build_pipeline()` |
| `load_audio.py` | load_audio | WAV/오디오 파일 로드 (librosa/scipy) |
| `feature_extraction.py` | feature_extraction | STFT, Goertzel, 에너지 계산 |
| `threshold.py` | threshold | Otsu 적응형 임계값 산출 |
| `state_machine.py` | state_machine | ON/OFF 상태 전이 판별 |
| `gap_fill.py` | gap_fill | 짧은 OFF 구간 병합 (최대 2분) |
| `trim.py` | trim | 앞뒤 여백 제거 |
| `noise_removal.py` | noise_removal | 최소 지속시간 미만 세그먼트 제거 |

## 엔진 버전 관리 규칙

1. **V5.7은 baseline** -- 삭제/수정 금지
2. 새 엔진은 별도 `.py` 파일로 생성
3. `registry.py`의 `_ENGINES`에 등록
4. `config/` 폴더에 JSON 설정 분리
5. `.env`의 `ANALYSIS_ENGINE`으로 엔진 전환
6. 모든 엔진은 `SuggestionDraft` 출력 포맷 통일
7. 파이프라인 스텝은 엔진 간 재사용 가능

## 새 스텝 추가 절차

1. `steps/` 폴더에 새 파일 생성 (`PipelineStep` 상속)
2. `steps/__init__.py`의 `STEP_REGISTRY`에 등록
3. `config/` 폴더의 JSON 설정 `steps` 배열에 추가

## 분석 흐름 요약

```
upload -> AnalysisService.analyze()
  -> EngineRegistry에서 엔진 조회
  -> 엔진.analyze() 호출 (timeout 120초)
  -> 실패 시 RuleFallbackEngine 자동 전환
  -> SuggestionDraft[] 반환 -> DB 저장
```
