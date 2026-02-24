"""Supabase auth helpers for API routes."""
from __future__ import annotations

import logging
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    id: str
    email: str | None
    name: str | None


def _extract_user(auth_response: object) -> object | None:
    # supabase-py shape can differ by version; try common fields defensively.
    user = getattr(auth_response, "user", None)
    if user is not None:
        return user

    data = getattr(auth_response, "data", None)
    if data is not None:
        nested_user = getattr(data, "user", None)
        if nested_user is not None:
            return nested_user

    return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    try:
        auth_response = supabase.auth.get_user(token)
        user = _extract_user(auth_response)
    except Exception as exc:
        logger.exception("Supabase auth verification failed")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = getattr(user, "id", None)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    email = getattr(user, "email", None)
    metadata = getattr(user, "user_metadata", None) or {}
    if not isinstance(metadata, dict):
        metadata = {}
    name = metadata.get("full_name") or metadata.get("name")

    return CurrentUser(id=str(user_id), email=email, name=name)


def ensure_sst_user_exists(user: CurrentUser) -> bool:
    """Ensure sst_users row exists for authenticated user."""
    try:
        res = (
            supabase.table("sst_users")
            .select("id")
            .eq("id", user.id)
            .limit(1)
            .execute()
        )
        rows = getattr(res, "data", None) or []
        if rows:
            return True

        email = user.email or f"{user.id}@unknown.local"
        name = user.name or email.split("@")[0]

        supabase.table("sst_users").upsert(
            {
                "id": user.id,
                "name": name,
                "email": email,
                "role": "junior_tagger",
                "today_score": 0,
                "accuracy": 0,
                "all_time_score": 0,
            },
            on_conflict="id",
        ).execute()
        return True
    except Exception:
        logger.exception("Failed to ensure sst_users row", extra={"user_id": user.id})
        return False
