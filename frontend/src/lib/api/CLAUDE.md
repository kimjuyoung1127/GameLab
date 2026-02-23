# API 통신 레이어 (BE api/와 1:1 미러)

## 파일 목록

| 파일 | 주요 함수 | API 엔드포인트 |
|------|----------|---------------|
| `upload.ts` | `uploadFiles()` | `POST /api/upload/files` (FormData 멀티파트) |
| `jobs.ts` | `getJobStatus()` | `GET /api/jobs/{jobId}` (폴링용) |
| `sessions.ts` | `listSessions()`, `getSessionFiles()`, `deleteSession()` | `GET/DELETE /api/sessions/*` |
| `labeling.ts` | `getSuggestions()`, `updateSuggestionStatus()`, `exportLabeling()` | `GET/PATCH /api/labeling/*` |
| `overview.ts` | `getOverviewMetrics()` | `GET /api/overview/metrics` |
| `leaderboard.ts` | `getLeaderboard()` | `GET /api/leaderboard` |
| `action-queue.ts` | `enqueueStatusUpdate()` | — (직렬 처리 큐) |
| `endpoints.ts` | — | barrel re-export (하위 호환) |

## 공통 패턴

각 파일은 동일한 패턴을 따른다:

1. `xxxEndpoints` 객체 export — URL 생성 함수 모음
2. fetch wrapper 함수 — 에러 처리, JSON 파싱 포함
3. `NEXT_PUBLIC_API_URL` 환경변수를 기본 URL로 사용

## action-queue.ts 상세

핫키 스팸 방어의 핵심 모듈:

| 기능 | 설명 |
|------|------|
| 직렬 처리 | 요청을 큐에 넣고 순서대로 실행 |
| 중복 병합 | 같은 ID의 연속 업데이트를 하나로 병합 |
| 오프라인 폴백 | 네트워크 실패 시 localStorage에 저장 |
| 재시도 | 최대 3회 재시도 후 오프라인 큐로 이동 |

**주의: 이 파일은 라벨링 안정성의 핵심이므로 수정 시 각별히 주의할 것**

## 규칙

- 새 API 파일 추가 시 `endpoints.ts`에 re-export 추가
- 기존 import `from '@/lib/api/endpoints'` 호환 유지
- BE 라우터 변경 시 대응 파일 동시 수정
