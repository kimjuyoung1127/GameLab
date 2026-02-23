# Services — 서비스 레이어 (비즈니스 로직)

## 파일 목록

| 파일/폴더 | 설명 |
|---|---|
| `job_manager.py` | 인메모리 잡 상태 관리 |
| `analysis/` | 분석 엔진 서브시스템 (플러그인 아키텍처) |

## job_manager.py — 잡 상태 관리

딕셔너리 기반 인메모리 스토어로 업로드/분석 잡의 상태를 추적한다.

### 주요 함수

| 함수 | 설명 |
|---|---|
| `register_job(job_id)` | 새 잡을 `pending` 상태로 등록 |
| `set_job_status(job_id, status, ...)` | 잡 상태 변경 (`processing`, `completed`, `failed`) |
| `get_job(job_id)` | 잡 상태 조회 (없으면 `None`) |

### 제약사항

- **서버 재시작 시 모든 잡 데이터 유실** (인메모리)
- Phase 2B에서 DB 테이블(`sst_jobs`)로 전환 예정
- 현재는 단일 프로세스 환경 전제

## analysis/ 서브시스템

분석 엔진의 핵심 로직을 담당하는 별도 서브시스템.
상세 구조는 `analysis/CLAUDE.md` 참조.

### 주요 구성

| 구성요소 | 설명 |
|---|---|
| `AnalysisService` | 분석 facade (타임아웃 + 자동 폴백) |
| `EngineRegistry` | 엔진 이름 -> 인스턴스 매핑 |
| `SoundLabV57Engine` | V5.7 기본 분석 엔진 |
| `RuleFallbackEngine` | 비상 폴백 엔진 |
| `Pipeline Framework` | 스텝 기반 처리 파이프라인 |
