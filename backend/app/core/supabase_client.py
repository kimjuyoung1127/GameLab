"""Supabase client singleton and accessor."""
from supabase import Client, create_client

from app.core.config import settings

supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)


def get_supabase() -> Client:
    return supabase
