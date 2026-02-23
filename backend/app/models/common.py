"""CamelModel 베이스 클래스 — JSON 직렬화 시 camelCase 자동 변환."""
from pydantic import BaseModel, ConfigDict


def to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


class CamelModel(BaseModel):
    """Base model that serializes to camelCase JSON."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
