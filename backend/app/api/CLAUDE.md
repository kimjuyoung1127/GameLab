# API — REST 라우터 (FE lib/api/와 1:1 미러)

## prefix 규칙

모든 라우터는 `/api/{도메인}` prefix를 사용한다.

## 라우터 목록

| 파일 | 엔드포인트 | 설명 |
|---|---|---|
| `upload/router.py` | `POST /api/upload/files` | 멀티파트 업로드, 확장자/크기 검증, 메타데이터 추출, 비동기 분석 트리거 |
| `jobs/router.py` | `GET /api/jobs/{job_id}` | 폴링용 잡 상태 조회 |
| `sessions/router.py` | `GET /api/sessions` | 세션 목록 조회 |
| | `GET /api/sessions/{id}/files` | 세션별 파일 목록 |
| | `DELETE /api/sessions/{id}` | 세션 삭제 (cascade: suggestions -> files -> session) |
| `labeling/router.py` | `GET /api/labeling/{session_id}/suggestions` | 세션별 제안 목록 |
| | `PATCH /api/labeling/suggestions/{id}` | 제안 상태 변경 (멱등적) |
| | `GET /api/labeling/{session_id}/export` | CSV/JSON 내보내기 (`?format=csv\|json`, StreamingResponse) |
| `overview/router.py` | `GET /api/overview/metrics` | 대시보드 메트릭 조회 |
| `leaderboard/router.py` | `GET /api/leaderboard` | 리더보드 조회 |

## FE 미러 매핑

| BE 라우터 | FE API 모듈 |
|---|---|
| `upload/router.py` | `lib/api/upload.ts` |
| `jobs/router.py` | `lib/api/jobs.ts` |
| `sessions/router.py` | `lib/api/sessions.ts` |
| `labeling/router.py` | `lib/api/labeling.ts` |
| `overview/router.py` | `lib/api/overview.ts` |
| `leaderboard/router.py` | `lib/api/leaderboard.ts` |

## 규칙

1. 새 엔드포인트 추가 시 FE `lib/api/` 동시 변경
2. `main.py`에 라우터 등록 잊지 말 것
3. 세션 삭제는 cascade 순서 준수: suggestions -> files -> session
