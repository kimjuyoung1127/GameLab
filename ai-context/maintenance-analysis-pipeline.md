# 분석 파이프라인 유지보수 가이드

기준일: 2026-02-12 (KST)
대상: `backend/app/services/analysis/` 전체

---

## 1) 아키텍처 개요

```
                    ┌────────────────────────┐
                    │   JSON Config File     │  ← 소켓 1: 파라미터 설정
                    │ backend/config/*.json  │
                    └────────┬───────────────┘
                             ↓
┌──────────────────────────────────────────────────────────┐
│  AnalysisService (service.py)                            │
│  - timeout (120s) + auto-fallback + structured logging   │
└────────┬─────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│  EngineRegistry (registry.py)                            │
│  - ANALYSIS_ENGINE 환경변수로 엔진 선택                    │
│  - soundlab_v57, rule_fallback 등                        │
└────────┬─────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│  SoundLabV57Engine (soundlab_v57.py)                     │
│  - JSON config 로드 → build_pipeline() → 실행            │
│  - segments_to_drafts() → SuggestionDraft[]              │
└────────┬─────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│  AnalysisPipeline (pipeline.py)                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  steps/ 디렉토리 ← 소켓 2: 로직 플러그              │ │
│  │  LoadAudioStep → FeatureExtractionStep →            │ │
│  │  OtsuThresholdStep → StateMachineStep →             │ │
│  │  GapFillStep → TrimStep → NoiseRemovalStep          │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**2-소켓 구조:**
1. **소켓 1 (설정)**: `backend/config/analysis_v57.json` — 파라미터만 변경
2. **소켓 2 (로직)**: `backend/app/services/analysis/steps/` — 스텝 클래스 교체/추가

---

## 2) JSON 설정 수정 방법 (파라미터 변경)

### 파일 위치
`backend/config/analysis_v57.json`

### 주요 설정값

| 섹션 | 키 | 설명 | 기본값 |
|------|-----|------|--------|
| `bands.id_wide` | `freq`, `bw` | ID 밴드 주파수/대역폭 | 535Hz, ±10Hz |
| `bands.surge_60` | `freq`, `bw` | 서지 60Hz 밴드 | 60Hz, ±2Hz |
| `threshold` | `multiplier` | Otsu 임계값 배수 | 1.5 |
| `threshold` | `hysteresis_factor` | OFF 전이 히스테리시스 | 0.8 |
| `gap_fill` | `max_gap_minutes` | 갭 채우기 최대 시간 | 2.0분 |
| `trim` | `drop_ratio` | 트리밍 드롭 비율 | 0.5 |
| `noise_removal` | `min_segment_duration_minutes` | 최소 세그먼트 길이 | 1.0분 |

### 예시: 임계값 민감도 조정
```json
{
  "threshold": {
    "method": "otsu",
    "multiplier": 2.0,          ← 1.5 → 2.0으로 변경 (덜 민감)
    "hysteresis_factor": 0.7    ← 0.8 → 0.7로 변경 (OFF 더 빠르게)
  }
}
```

### 예시: 새 주파수 대역 추가
```json
{
  "bands": {
    "id_wide":   { "freq": 535.0, "bw": 10.0, "label": "Machine ON" },
    "surge_60":  { "freq": 60.0,  "bw": 2.0,  "label": "Startup Surge Detected" },
    "surge_120": { "freq": 120.0, "bw": 2.0,  "label": "Startup Surge Detected" },
    "diag_180":  { "freq": 180.0, "bw": 2.0,  "label": "Diagnostic Band Activity" },
    "custom_1k": { "freq": 1000.0, "bw": 5.0,  "label": "Custom 1kHz Band" }
  }
}
```
→ 코드 변경 없음. FeatureExtractionStep이 자동으로 새 밴드의 에너지를 추출.

### 적용 방법
1. JSON 파일 수정
2. 서버 재시작 (`uvicorn` 재기동)
3. WAV 파일 업로드하여 결과 확인

---

## 3) 새 스텝 추가 방법 (로직 교체)

### 시나리오: Otsu → Percentile 임계값 교체

1. **새 스텝 파일 생성**: `backend/app/services/analysis/steps/percentile_threshold.py`

```python
import numpy as np
from app.services.analysis.pipeline import AnalysisContext, PipelineStep

class PercentileThresholdStep(PipelineStep):
    def execute(self, ctx: AnalysisContext) -> AnalysisContext:
        config = ctx.config
        threshold_cfg = config.get("threshold", {})
        percentile = threshold_cfg.get("percentile", 90)

        energies_id = ctx.energies.get("id_wide", np.array([]))
        if len(energies_id) > 0:
            threshold_id = float(np.percentile(energies_id, percentile))
        else:
            threshold_id = 0.0

        ctx.thresholds["id_wide"] = threshold_id
        # surge thresholds도 동일 패턴...
        return ctx
```

2. **레지스트리 등록**: `steps/__init__.py`

```python
from .percentile_threshold import PercentileThresholdStep

STEP_REGISTRY["percentile_threshold"] = PercentileThresholdStep
```

3. **JSON config 수정**: `analysis_v57.json` (또는 새 JSON 파일)

```json
{
  "steps": [
    "load_audio",
    "feature_extraction",
    "percentile_threshold",    ← "threshold" 대신 교체
    "state_machine",
    "gap_fill",
    "trim",
    "noise_removal"
  ],
  "threshold": {
    "method": "percentile",
    "percentile": 90
  }
}
```

4. 서버 재시작

---

## 4) 새 엔진 버전 생성 방법 (V6.0 등)

### Step 1: JSON 설정 파일 생성
`backend/config/analysis_v60.json` — V5.7 복사 후 수정

### Step 2: 엔진 클래스 생성 (필요 시)
`backend/app/services/analysis/soundlab_v60.py`:

```python
from app.services.analysis.soundlab_v57 import SoundLabV57Engine

class SoundLabV60Engine(SoundLabV57Engine):
    """V6.0: V5.7 기반 + 커스텀 변경."""
    _CONFIG_FILENAME = "analysis_v60.json"
    # 대부분의 로직은 V5.7 재사용
```

### Step 3: 레지스트리 등록
`backend/app/services/analysis/registry.py`:
```python
from .soundlab_v60 import SoundLabV60Engine
_ENGINES["soundlab_v60"] = SoundLabV60Engine
```

### Step 4: 환경변수 변경
```
ANALYSIS_ENGINE=soundlab_v60
```

---

## 5) 트러블슈팅 / FAQ

### Q: 분석이 너무 오래 걸림
- `backend/.env`에서 `ANALYSIS_TIMEOUT_SEC=300`으로 타임아웃 늘리기
- 또는 `ANALYSIS_ENGINE=rule_fallback`으로 임시 전환

### Q: WAV가 아닌 파일 업로드 시 에러
- 현재 SoundLabV57Engine은 WAV 전용 (`scipy.io.wavfile`)
- `.m4a`/`.mp3`는 자동으로 `rule_fallback`이 처리
- 향후 `librosa` 추가로 해결 가능

### Q: 감지 결과가 없음 (0개 suggestion)
- JSON에서 `threshold.multiplier` 값을 낮추기 (1.5 → 1.0)
- 또는 `noise_removal.min_segment_duration_minutes`를 줄이기

### Q: 너무 많은 suggestion이 생김
- `threshold.multiplier` 높이기 (1.5 → 2.0)
- `gap_fill.max_gap_minutes` 줄이기

### Q: 서버 시작 시 JSON 파일 못 찾음
- `backend/.env`에 `ANALYSIS_CONFIG_DIR=./config` 확인
- 서버 실행 위치가 `backend/` 디렉토리인지 확인

---

## 6) 디렉토리 구조

```
backend/
├── config/
│   └── analysis_v57.json              ← 파라미터 설정
├── app/services/analysis/
│   ├── engine.py                      ← ABC + SuggestionDraft
│   ├── pipeline.py                    ← 프레임워크
│   ├── steps/                         ← 스텝 플러그
│   │   ├── __init__.py               ← STEP_REGISTRY
│   │   ├── load_audio.py
│   │   ├── feature_extraction.py
│   │   ├── threshold.py
│   │   ├── state_machine.py
│   │   ├── gap_fill.py
│   │   ├── trim.py
│   │   └── noise_removal.py
│   ├── soundlab_v57.py                ← V5.7 엔진
│   ├── rule_fallback.py               ← Fallback 엔진
│   ├── registry.py                    ← 엔진 팩토리
│   └── service.py                     ← timeout/fallback/logging
└── tests/
    ├── test_analysis_harness.py       ← 11개 테스트
    └── fixtures/
        ├── generate_test_fixtures.py  ← WAV 생성 스크립트
        ├── audio/                     ← 합성 WAV (gitignore 권장)
        └── expected/                  ← 회귀 기준 JSON
```
