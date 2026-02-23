# App — FastAPI 앱 코어

## 진입점: `main.py`

- FastAPI 인스턴스 생성 및 CORS 미들웨어 설정
- 6개 도메인 라우터 등록
- `/uploads` 경로에 StaticFiles 마운트
- `/health` 헬스체크 엔드포인트

## 라우터 등록 순서

| 순서 | 라우터 | prefix |
|---|---|---|
| 1 | upload | `/api/upload` |
| 2 | jobs | `/api/jobs` |
| 3 | overview | `/api/overview` |
| 4 | sessions | `/api/sessions` |
| 5 | labeling | `/api/labeling` |
| 6 | leaderboard | `/api/leaderboard` |

## 폴더 구조

| 폴더 | 설명 |
|---|---|
| `core/` | 설정(config.py) + DB 클라이언트(supabase_client.py) |
| `models/` | Pydantic 도메인 모델 (7개 파일) |
| `api/` | REST API 라우터 (6개 도메인) |
| `services/` | 비즈니스 로직 (잡 관리, 분석 엔진) |

## FE 미러링 규칙

백엔드와 프론트엔드는 **1:1 미러 구조**를 따른다.

| BE 경로 | FE 경로 |
|---|---|
| `models/{domain}.py` | `frontend/src/types/{domain}.ts` |
| `api/{domain}/router.py` | `frontend/src/lib/api/{domain}.ts` |

모델 또는 API 변경 시 **반드시 양쪽 동시 수정** 필요.
