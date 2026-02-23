# Models — Pydantic 도메인 모델 (FE 타입과 1:1 미러)

## CamelModel 패턴

`common.py`의 `CamelModel`을 상속하면 JSON 직렬화 시 **camelCase**로 변환된다.
모든 도메인 모델은 이 베이스 클래스를 사용한다.

## 파일 목록

| 파일 | 주요 모델/타입 | FE 미러 |
|---|---|---|
| `common.py` | `CamelModel` (베이스 클래스) | `types/common.ts` |
| `upload.py` | `UploadJobStatus` enum, `UploadResult` | `types/upload.ts` |
| `jobs.py` | `JobStatusResponse` | `types/jobs.ts` |
| `sessions.py` | `SessionResponse`, `AudioFileResponse` | `types/sessions.ts` |
| `labeling.py` | `SuggestionStatusValue` enum, `SuggestionResponse`, `UpdateSuggestionRequest` | `types/labeling.ts` |
| `overview.py` | `OverviewMetrics` | `types/overview.ts` |
| `leaderboard.py` | `LeaderboardEntry` | `types/leaderboard.ts` |
| `schemas.py` | 하위 호환 barrel re-export | `types/index.ts` |

## 주요 Enum

| Enum | 값 |
|---|---|
| `UploadJobStatus` | `pending`, `processing`, `completed`, `failed` |
| `SuggestionStatusValue` | `pending`, `approved`, `rejected` |

## 규칙

1. 새 모델 추가 시 **반드시** `schemas.py`에 re-export 추가
2. FE `types/` 디렉터리에 동일 구조의 TypeScript 타입 동시 생성
3. 모든 모델은 `CamelModel`을 상속하여 camelCase 직렬화 보장
4. DB 컬럼명(snake_case)과 API 응답(camelCase)이 자동 변환됨
