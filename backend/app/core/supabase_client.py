"""Supabase 클라이언트 싱글턴 인스턴스 생성."""
from supabase import create_client, Client
from app.core.config import settings

supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
