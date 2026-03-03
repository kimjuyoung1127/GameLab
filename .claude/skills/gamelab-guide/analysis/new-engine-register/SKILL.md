---
name: new-engine-register
description: "새 분석 엔진 등록 — new engine, 엔진 추가, analysis engine, 분석 엔진, 알고리즘 추가"
---

## Trigger
사용자가 "new engine", "새 엔진", "analysis engine", "분석 엔진 추가", "알고리즘 추가"를 요청할 때 활성화.

## Input Context
- 엔진 이름
- 알고리즘 설명
- 새 파이프라인 스텝 필요 여부

## Read First
1. `backend/app/services/analysis/CLAUDE.md` — 전체 아키텍처 + 규칙
2. `backend/app/services/analysis/engine.py` — `AnalysisEngine` ABC + `SuggestionDraft`
3. `backend/app/services/analysis/registry.py` — `_ENGINES` dict
4. `backend/app/services/analysis/soundlab_v57.py` — 레퍼런스 baseline 구현 (수정 금지)
5. `backend/app/services/analysis/pipeline.py` — `PipelineStep` ABC
6. `backend/app/services/analysis/steps/__init__.py` — `STEP_REGISTRY` + `build_pipeline()`
7. `backend/config/analysis_v57.json` — 레퍼런스 설정

## Do
1. `backend/app/services/analysis/{engine_name}.py` 생성 — `AnalysisEngine` ABC 구현
2. 출력은 `list[SuggestionDraft]` 계약 준수 필수
3. `registry.py`의 `_ENGINES` dict에 등록
4. `backend/config/analysis_{name}.json` 설정 파일 생성
5. 새 파이프라인 스텝 필요 시 `steps/`에 추가하고 `STEP_REGISTRY`에 등록
6. 한국어 헤더 주석 추가
7. `cd backend && python -m pytest tests/ -v` 실행

## Do Not
1. `soundlab_v57.py`를 수정하지 않는다 (baseline 보호)
2. `SuggestionDraft` 출력 필드를 변경하지 않는다
3. `service.py`의 fallback 동작을 변경하지 않는다
4. FE 코드를 수정하지 않는다 (FE는 엔진에 무관해야 함)

## Validation
- [ ] `soundlab_v57.py` 변경 없음 (diff 확인)
- [ ] 새 엔진이 `AnalysisEngine` ABC를 구현
- [ ] 출력이 `SuggestionDraft` 계약과 일치
- [ ] `registry.py`에 등록됨
- [ ] 설정 JSON이 `backend/config/`에 존재
- [ ] `ANALYSIS_ENGINE` 환경변수로 새 엔진으로 전환 가능
- [ ] 에러 시 `rule_fallback`으로의 fallback 동작 보존
- [ ] `python -m pytest tests/ -v` 통과

## Output Template
```
[new-engine-register 완료]
- 엔진: {engine_name}
- 파일: backend/app/services/analysis/{engine_name}.py
- 설정: backend/config/analysis_{name}.json
- 레지스트리: 등록 완료
- 기존 엔진 영향: 없음
- 테스트: pass
```
