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

    class Config:
        env_file = ".env"


settings = Settings()
