from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    allowed_origins: str = "http://localhost:3000"
    public_file_base_url: str = "http://localhost:8000"
    max_file_size_mb: int = 1024
    upload_dir: str = "./uploads"
    allowed_extensions: list[str] = [".wav", ".m4a", ".mp3"]
    analysis_engine: str = "rule_fallback"

    class Config:
        env_file = ".env"


settings = Settings()
