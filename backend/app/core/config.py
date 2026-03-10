"""Pydantic BaseSettings 기반 환경변수 설정 관리."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str | None = None
    allowed_origins: str = "http://localhost:3000"
    max_file_size_mb: int = 1024
    temp_upload_dir: str = "./temp_uploads"
    allowed_extensions: list[str] = [".wav", ".m4a", ".mp3"]
    analysis_engine: str = "soundlab_v57"
    analysis_timeout_sec: int = 120
    analysis_config_dir: str = "./config"

    # LLM Assist
    llm_assist_enabled: bool = True
    llm_provider: str = "google"
    llm_model: str = "gemini-2.5-flash"
    llm_audio_mode: bool = True
    llm_max_clip_sec: float = 10.0
    llm_trigger_max_confidence: int = 70
    llm_timeout_sec: int = 30
    google_api_key: str = ""
    llm_batch_concurrency: int = 5
    llm_batch_max_size: int = 50

    class Config:
        env_file = ".env"


settings = Settings()

import logging as _logging
_config_logger = _logging.getLogger(__name__)
if settings.llm_assist_enabled and not settings.google_api_key:
    _config_logger.warning(
        "llm_assist_enabled=True but google_api_key is empty — LLM assist will fail at runtime"
    )
