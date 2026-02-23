"""Supabase client singleton and accessor."""
from supabase import Client, create_client

from app.core.config import settings

# Backend should prefer service-role key for trusted server-side operations.
supabase_key = settings.supabase_service_role_key or settings.supabase_anon_key
supabase: Client = create_client(settings.supabase_url, supabase_key)


def get_supabase() -> Client:
    return supabase
