# Core — 설정 및 인프라

## 파일 목록

| 파일 | 설명 |
|---|---|
| `config.py` | Pydantic BaseSettings 기반 앱 설정 |
| `supabase_client.py` | 싱글턴 Supabase Client 생성 |

## config.py — 설정 변수

Pydantic `BaseSettings`를 상속하며, `.env` 파일에서 값을 로드한다.

| 변수 | 타입 | 설명 |
|---|---|---|
| `supabase_url` | `str` | Supabase 프로젝트 URL |
| `supabase_anon_key` | `str` | Supabase anon 키 |
| `allowed_origins` | `list[str]` | CORS 허용 오리진 |
| `public_file_base_url` | `str` | 파일 공개 URL 접두어 |
| `max_file_size_mb` | `int` | 최대 파일 크기(MB) |
| `upload_dir` | `str` | 업로드 저장 경로 |
| `allowed_extensions` | `list[str]` | 허용 파일 확장자 |
| `analysis_engine` | `str` | 분석 엔진 이름 |
| `analysis_timeout_sec` | `int` | 분석 타임아웃(초) |
| `analysis_config_dir` | `str` | 분석 설정 JSON 디렉터리 |

## supabase_client.py — Supabase 클라이언트

`create_client()`로 싱글턴 인스턴스를 생성한다.

## 사용법

```python
from app.core.config import settings
from app.core.supabase_client import supabase
```

## 주의사항

- `.env`가 BaseSettings 기본값을 **override**함
- 새 설정 추가 시 `config.py`와 `.env` 양쪽에 반영 필요
