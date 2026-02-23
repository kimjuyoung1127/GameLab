# Backend — FastAPI + Supabase 백엔드

## 실행 방법

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

기본 포트: `http://localhost:8000`

## 환경변수 (`.env`)

| 변수명 | 설명 | 기본값 |
|---|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL | (필수) |
| `SUPABASE_ANON_KEY` | Supabase anon 키 | (필수) |
| `ANALYSIS_ENGINE` | 분석 엔진 선택 | `soundlab_v57` |
| `ANALYSIS_TIMEOUT_SEC` | 분석 타임아웃(초) | `120` |
| `UPLOAD_DIR` | 업로드 파일 저장 경로 | `uploads` |
| `MAX_FILE_SIZE_MB` | 최대 파일 크기(MB) | `1024` |
| `ALLOWED_EXTENSIONS` | 허용 확장자 | `.wav,.mp3,.flac` |
| `ANALYSIS_CONFIG_DIR` | 분석 설정 JSON 경로 | `config` |
| `ALLOWED_ORIGINS` | CORS 허용 오리진 | `http://localhost:3000` |
| `PUBLIC_FILE_BASE_URL` | 파일 공개 URL 접두어 | (선택) |

## 폴더 구조

| 폴더 | 설명 |
|---|---|
| `app/` | FastAPI 앱 코어 (라우터, 모델, 서비스) |
| `config/` | 분석 설정 JSON 파일 |
| `tests/` | pytest 테스트 |
| `uploads/` | 업로드된 오디오 파일 저장소 |

## 주요 의존성 (`requirements.txt`)

| 패키지 | 버전 | 용도 |
|---|---|---|
| FastAPI | 0.115.6 | 웹 프레임워크 |
| Uvicorn | - | ASGI 서버 |
| Supabase | 2.13.0 | DB/인증 클라이언트 |
| Pydantic | 2.10.5 | 데이터 검증/직렬화 |
| NumPy | - | 수치 연산 |
| SciPy | - | 오디오 처리 |
| scikit-image | - | Otsu 임계값 |
| pytest | - | 테스트 프레임워크 |

## 주의사항

- `.env` 파일이 Pydantic BaseSettings의 기본값을 **override**함
- 설정 변경 시 `.env`와 `app/core/config.py` 양쪽 확인 필요
- FE(`frontend/`)와 1:1 미러 구조 유지 — 모델/API 변경 시 양쪽 동시 수정
