#!/usr/bin/env python3
"""Register a NotebookLM notebook in the local notebooklm-mcp library."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_LIBRARY = Path.home() / "AppData" / "Local" / "notebooklm-mcp" / "Data" / "library.json"


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:30] or "notebook"


def load_library(path: Path) -> dict:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        return {
            "notebooks": [],
            "active_notebook_id": None,
            "last_modified": iso_now(),
            "version": "1.0.0",
        }
    return json.loads(path.read_text(encoding="utf-8"))


def save_library(path: Path, library: dict) -> None:
    library["last_modified"] = iso_now()
    path.write_text(json.dumps(library, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def ensure_unique_id(library: dict, base_id: str) -> str:
    existing = {item["id"] for item in library.get("notebooks", [])}
    if base_id not in existing:
        return base_id
    index = 1
    while f"{base_id}-{index}" in existing:
        index += 1
    return f"{base_id}-{index}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--topics", default="")
    parser.add_argument("--tags", default="")
    parser.add_argument("--activate", action="store_true")
    parser.add_argument("--library", default=str(DEFAULT_LIBRARY))
    args = parser.parse_args()

    library_path = Path(args.library)
    library = load_library(library_path)

    existing = next((item for item in library["notebooks"] if item["url"] == args.url), None)
    if existing:
        existing["name"] = args.name
        existing["description"] = args.description
        existing["topics"] = [item.strip() for item in args.topics.split(",") if item.strip()]
        existing["tags"] = [item.strip() for item in args.tags.split(",") if item.strip()]
        existing["last_used"] = iso_now()
        notebook_id = existing["id"]
    else:
        notebook_id = ensure_unique_id(library, slugify(args.name))
        library["notebooks"].append(
            {
                "id": notebook_id,
                "url": args.url,
                "name": args.name,
                "description": args.description,
                "topics": [item.strip() for item in args.topics.split(",") if item.strip()],
                "content_types": ["documentation", "notes"],
                "use_cases": [
                    "Source-grounded project research",
                    "Cross-checking skills and operational guidance",
                ],
                "added_at": iso_now(),
                "last_used": iso_now(),
                "use_count": 0,
                "tags": [item.strip() for item in args.tags.split(",") if item.strip()],
            }
        )

    if args.activate or library.get("active_notebook_id") is None:
        library["active_notebook_id"] = notebook_id

    save_library(library_path, library)
    print(json.dumps({"library": str(library_path), "notebook_id": notebook_id, "count": len(library["notebooks"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
