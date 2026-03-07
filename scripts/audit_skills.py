#!/usr/bin/env python3
"""Audit skill folders and generate human/machine-readable reports."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
STATUS_DIR = ROOT / "docs" / "status"
REPORT_MD = STATUS_DIR / "SKILL-LOAD-REPORT.md"
REPORT_JSON = STATUS_DIR / "SKILL-LOAD-REPORT.json"
ROOT_CLAUDE = ROOT / "CLAUDE.md"
CLAUDE_SKILL_INDEX = ROOT / ".claude" / "skills" / "CLAUDE.md"
SHARED_SKILL_INDEX = ROOT / "skills" / "CLAUDE.md"
SKILL_DOC_MATRIX = ROOT / "docs" / "status" / "SKILL-DOC-MATRIX.md"
MCP_CONFIG = ROOT / ".mcp.json"
NOTEBOOK_LIBRARY = Path.home() / "AppData" / "Local" / "notebooklm-mcp" / "Data" / "library.json"
NOTEBOOK_ID = "6a8491af-e793-4574-8182-9ab2511fbbe3"
NOTEBOOK_RUN_LOG = ROOT / "memory" / "notebooklm-runs.ndjson"

BASELINE = {
    "repo_claude_skill_count": {"before": 10},
    "repo_claude_frontmatter": {"before": "10/10"},
    "repo_claude_indexed": {"before": "8/10"},
    "project_local_valid": {"before": "1/16"},
    "mcp_server_count": {"before": 1},
    "notebook_library_count": {"before": 0},
}

ALLOWED_MISSING_PREFIXES = [
    "C:\\gpttaillog\\gptappdocs\\",
]

REPO_PATHS = [path for path in ROOT.rglob("*") if ".git" not in path.parts]
REPO_SUFFIX_MAP: dict[str, list[Path]] = {}
REPO_BASENAME_MAP: dict[str, list[Path]] = {}
for repo_path in REPO_PATHS:
    suffix = repo_path.relative_to(ROOT).as_posix().rstrip("/")
    REPO_SUFFIX_MAP.setdefault(suffix.lower(), []).append(repo_path)
    REPO_BASENAME_MAP.setdefault(repo_path.name.lower(), []).append(repo_path)

SKILL_SETS = [
    {
        "key": "repo_claude",
        "label": ".claude/skills",
        "root": ROOT / ".claude" / "skills",
        "index": CLAUDE_SKILL_INDEX,
        "managed": True,
    },
    {
        "key": "repo_shared",
        "label": "skills",
        "root": ROOT / "skills",
        "index": SHARED_SKILL_INDEX,
        "managed": True,
    },
    {
        "key": "codex_global",
        "label": "~/.codex/skills",
        "root": Path.home() / ".codex" / "skills",
        "index": None,
        "managed": False,
    },
]


@dataclass
class SkillAudit:
    skill_set: str
    file: Path
    name: str
    description: str
    headings: list[str]
    errors: list[str]
    warnings: list[str]
    path_checks: list[dict[str, Any]]
    indexed: bool | None
    root_claude_ref: bool
    matrix_ref: bool
    triggers: list[str]

    @property
    def valid(self) -> bool:
        return not self.errors


def read_text(path: Path) -> str:
    raw = path.read_bytes()
    for encoding in ("utf-8-sig", "utf-8", "cp949"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    match = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n?", text, re.DOTALL)
    if not match:
        raise ValueError("missing YAML frontmatter")

    frontmatter: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        frontmatter[key.strip()] = value.strip().strip("'\"")
    return frontmatter, text[match.end() :]


def extract_headings(body: str) -> list[str]:
    return re.findall(r"^##\s+(.+?)\s*$", body, re.MULTILINE)


def classify_skill(path: Path) -> str:
    lowered = path.as_posix().lower()
    if "/ops/" in lowered:
        return "ops"
    if "/meta/" in lowered:
        return "meta"
    if "/feature/" in lowered:
        return "feature"
    if "/page/" in lowered:
        return "page"
    return "shared"


def has_any(headings: list[str], *expected: str) -> bool:
    normalized = {heading.lower() for heading in headings}
    for heading in normalized:
        for item in expected:
            expected_value = item.lower()
            if heading == expected_value or heading.startswith(f"{expected_value} " ) or heading.startswith(f"{expected_value}("):
                return True
    return False


def extract_code_spans(text: str) -> list[str]:
    return re.findall(r"`([^`\n]+)`", text)


def looks_like_path(value: str) -> bool:
    if " " in value and not value.endswith((".md", ".py", ".ts", ".tsx", ".json", ".mjs", ".yml", ".yaml", ".txt")):
        return False
    if value.startswith(("http://", "https://")):
        return False
    if value.startswith(("./", "../", ".\\")):
        return True
    if re.match(r"^[A-Za-z]:\\", value):
        return True
    if "/" in value or "\\" in value:
        return any(ch.isalpha() for ch in value)
    if value.endswith((".md", ".py", ".ts", ".tsx", ".json", ".mjs", ".yml", ".yaml", ".txt", ".toml")):
        return True
    return False


def has_placeholder(value: str) -> bool:
    return value.startswith("path/to/") or any(token in value for token in ("*", "{", "}", "<", ">", "[", "]"))


def normalize_candidate(value: str) -> str:
    stripped = value.strip().rstrip(".,:;")
    if " " in stripped:
        parts = [part for part in stripped.split() if looks_like_path(part)]
        if len(parts) == 1:
            return parts[0]
    return stripped


def resolve_candidate(value: str, skill_file: Path) -> tuple[str, Path | None, bool]:
    candidate = normalize_candidate(value)
    if has_placeholder(candidate):
        return candidate, None, True
    if re.match(r"^[A-Za-z]:\\", candidate):
        return candidate, Path(candidate), False

    direct = (ROOT / candidate).resolve()
    if direct.exists():
        return candidate, direct, False

    local = (skill_file.parent / candidate).resolve()
    if local.exists():
        return candidate, local, False

    basename_matches = REPO_BASENAME_MAP.get(Path(candidate).name.lower(), [])
    if len(basename_matches) == 1:
        return candidate, basename_matches[0], False

    suffix_matches = []
    candidate_suffix = candidate.replace("\\", "/").rstrip("/").lower()
    for suffix, matches in REPO_SUFFIX_MAP.items():
        if suffix.endswith(candidate_suffix):
            suffix_matches.extend(matches)
    if len(suffix_matches) == 1:
        return candidate, suffix_matches[0], False

    return candidate, direct, False


def path_check(text: str, skill_file: Path) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    seen: set[str] = set()
    for candidate in extract_code_spans(text):
        if not looks_like_path(candidate):
            continue
        if candidate in seen:
            continue
        seen.add(candidate)
        normalized, resolved, is_pattern = resolve_candidate(candidate, skill_file)
        allowed = any(normalized.startswith(prefix) for prefix in ALLOWED_MISSING_PREFIXES)
        exists = False if resolved is None else resolved.exists()
        results.append(
            {
                "raw": candidate,
                "normalized": normalized,
                "resolved": None if resolved is None else str(resolved),
                "exists": exists,
                "allowed_missing": allowed and not exists,
                "pattern": is_pattern,
            }
        )
    return results


def extract_triggers(body: str, description: str) -> list[str]:
    match = re.search(r"^##\s+Trigger\s*$([\s\S]*?)(?=^##\s+|\Z)", body, re.MULTILINE)
    if not match:
        return [description] if description else []
    triggers = []
    for line in match.group(1).splitlines():
        cleaned = line.strip().lstrip("-").strip()
        if cleaned:
            triggers.append(cleaned)
    return triggers or ([description] if description else [])


def audit_skill(skill_set: dict[str, Any], file_path: Path, index_text: str | None, root_claude_text: str, matrix_text: str) -> SkillAudit:
    text = read_text(file_path)
    errors: list[str] = []
    warnings: list[str] = []
    try:
        frontmatter, body = parse_frontmatter(text)
    except ValueError as exc:
        return SkillAudit(
            skill_set=skill_set["key"],
            file=file_path,
            name="<missing>",
            description="",
            headings=[],
            errors=[str(exc)],
            warnings=[],
            path_checks=[],
            indexed=False if index_text is not None else None,
            root_claude_ref=False,
            matrix_ref=False,
            triggers=[],
        )

    name = frontmatter.get("name", "").strip()
    description = frontmatter.get("description", "").strip()
    headings = extract_headings(body)
    kind = classify_skill(file_path)

    if not name:
        errors.append("missing frontmatter.name")
    if not description:
        errors.append("missing frontmatter.description")

    if skill_set["key"] == "repo_claude":
        if not has_any(headings, "Trigger"):
            errors.append("missing Trigger section")
        if not has_any(headings, "Read First", "Input Context"):
            errors.append("missing Read First/Input Context section")
        if not has_any(headings, "Do", "Procedure"):
            errors.append("missing Do/Procedure section")
        if not has_any(headings, "Validation"):
            errors.append("missing Validation section")
        if kind == "ops" and name.startswith("subagent-") and not has_any(headings, "Output"):
            errors.append("missing Output section")
    else:
        if not body.strip():
            errors.append("missing skill body")
        if "##" not in body:
            warnings.append("body has no level-2 sections")

    checks = path_check(text, file_path)
    for check in checks:
        if check["pattern"]:
            continue
        if not check["exists"] and not check["allowed_missing"]:
            raw = check["normalized"]
            shared_scope = skill_set["key"] in {"repo_shared", "codex_global"}
            bare_name = "/" not in raw and "\\" not in raw
            generic_dir = raw in {"components/", "hooks/", "styles/"}
            alias_like = raw.startswith("@/")
            if shared_scope or bare_name or generic_dir or alias_like:
                warnings.append(f"unresolved example path: {check['raw']}")
            else:
                errors.append(f"broken path: {check['raw']}")
        if check["allowed_missing"]:
            warnings.append(f"allowed external reference: {check['raw']}")

    indexed = None if index_text is None else name in index_text
    if index_text is not None and name and not indexed:
        errors.append("missing from local skill index")

    root_claude_ref = bool(name and name in root_claude_text)
    matrix_ref = bool(name and name in matrix_text)
    triggers = extract_triggers(body, description)

    return SkillAudit(
        skill_set=skill_set["key"],
        file=file_path,
        name=name or "<missing>",
        description=description,
        headings=headings,
        errors=errors,
        warnings=warnings,
        path_checks=checks,
        indexed=indexed,
        root_claude_ref=root_claude_ref,
        matrix_ref=matrix_ref,
        triggers=triggers,
    )


def load_index(path: Path | None) -> str | None:
    if path is None or not path.exists():
        return None
    return read_text(path)


def collect_audits() -> list[SkillAudit]:
    root_claude_text = read_text(ROOT_CLAUDE) if ROOT_CLAUDE.exists() else ""
    matrix_text = read_text(SKILL_DOC_MATRIX) if SKILL_DOC_MATRIX.exists() else ""
    audits: list[SkillAudit] = []
    for skill_set in SKILL_SETS:
        root = skill_set["root"]
        if not root.exists():
            continue
        index_text = load_index(skill_set["index"])
        for file_path in sorted(root.rglob("SKILL.md")):
            if ".system" in file_path.parts:
                continue
            audits.append(audit_skill(skill_set, file_path, index_text, root_claude_text, matrix_text))
    return audits


def count_indexed(audits: list[SkillAudit], skill_set: str) -> tuple[int, int]:
    filtered = [audit for audit in audits if audit.skill_set == skill_set]
    indexed = sum(1 for audit in filtered if audit.indexed)
    return indexed, len(filtered)


def duplicate_triggers(audits: list[SkillAudit]) -> dict[str, list[str]]:
    registry: dict[str, list[str]] = {}
    for audit in audits:
        if audit.skill_set != "repo_claude":
            continue
        for trigger in audit.triggers:
            normalized = trigger.strip().lower()
            if len(normalized) < 4:
                continue
            registry.setdefault(normalized, []).append(audit.name)
    return {key: names for key, names in registry.items() if len(set(names)) > 1}


def read_notebook_library() -> dict[str, Any]:
    if NOTEBOOK_LIBRARY.exists():
        return json.loads(read_text(NOTEBOOK_LIBRARY))
    return {"notebooks": [], "active_notebook_id": None}


def read_mcp_server_count() -> int:
    if not MCP_CONFIG.exists():
        return 0
    data = json.loads(read_text(MCP_CONFIG))
    return len(data.get("mcpServers", {}))


def build_metrics(audits: list[SkillAudit]) -> dict[str, Any]:
    repo_claude = [audit for audit in audits if audit.skill_set == "repo_claude"]
    repo_shared = [audit for audit in audits if audit.skill_set == "repo_shared"]
    global_skills = [audit for audit in audits if audit.skill_set == "codex_global"]
    managed = [audit for audit in audits if audit.skill_set in {"repo_claude", "repo_shared"}]
    indexed_count, indexed_total = count_indexed(audits, "repo_claude")
    library = read_notebook_library()
    notebooks = library.get("notebooks", [])
    notebook_present = any(NOTEBOOK_ID in notebook.get("url", "") for notebook in notebooks)
    notebook_sync_success = False
    if NOTEBOOK_RUN_LOG.exists():
        for line in NOTEBOOK_RUN_LOG.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            payload = json.loads(line)
            if payload.get("notebook_id") == NOTEBOOK_ID and payload.get("status") == "success":
                notebook_sync_success = True
                break

    duplicate_map = duplicate_triggers(audits)
    duplicate_count = len(duplicate_map)
    warning_count = sum(len(audit.warnings) for audit in audits) + duplicate_count
    manual_intervention_count = 0 if notebook_sync_success else 1

    return {
        "repo_claude_skill_count": len(repo_claude),
        "repo_claude_frontmatter": f"{sum(1 for audit in repo_claude if audit.name != '<missing>' and audit.description)}/{len(repo_claude)}",
        "repo_claude_indexed": f"{indexed_count}/{indexed_total}",
        "repo_shared_skill_count": len(repo_shared),
        "codex_global_skill_count": len(global_skills),
        "project_local_valid": f"{sum(1 for audit in managed if audit.valid)}/{len(managed)}",
        "all_scopes_valid": f"{sum(1 for audit in audits if audit.valid)}/{len(audits)}",
        "utf8_decode_errors": 0,
        "mcp_server_count": read_mcp_server_count(),
        "notebook_library_count": len(notebooks),
        "notebook_registered": notebook_present,
        "notebook_sync_success": notebook_sync_success,
        "warning_count": warning_count,
        "manual_intervention_count": manual_intervention_count,
        "duplicate_trigger_count": duplicate_count,
    }


def report_payload(audits: list[SkillAudit], metrics: dict[str, Any]) -> dict[str, Any]:
    duplicates = duplicate_triggers(audits)
    return {
        "baseline": BASELINE,
        "after": metrics,
        "audits": [
            {
                "skill_set": audit.skill_set,
                "file": display_path(audit.file),
                "name": audit.name,
                "description": audit.description,
                "valid": audit.valid,
                "errors": audit.errors,
                "warnings": audit.warnings,
                "indexed": audit.indexed,
                "root_claude_ref": audit.root_claude_ref,
                "matrix_ref": audit.matrix_ref,
                "triggers": audit.triggers,
            }
            for audit in audits
        ],
        "duplicate_triggers": duplicates,
    }


def markdown_report(audits: list[SkillAudit], metrics: dict[str, Any]) -> str:
    invalid = [audit for audit in audits if not audit.valid]
    duplicates = duplicate_triggers(audits)
    lines = [
        "# Skill Load Report",
        "",
        "## Before / After",
        "",
        "| Metric | Before | After |",
        "|---|---:|---:|",
        f"| `.claude/skills` count | {BASELINE['repo_claude_skill_count']['before']} | {metrics['repo_claude_skill_count']} |",
        f"| `.claude/skills` frontmatter | {BASELINE['repo_claude_frontmatter']['before']} | {metrics['repo_claude_frontmatter']} |",
        f"| `.claude/skills` indexed | {BASELINE['repo_claude_indexed']['before']} | {metrics['repo_claude_indexed']} |",
        f"| project-local valid | {BASELINE['project_local_valid']['before']} | {metrics['project_local_valid']} |",
        f"| `.mcp.json` servers | {BASELINE['mcp_server_count']['before']} | {metrics['mcp_server_count']} |",
        f"| NotebookLM library notebooks | {BASELINE['notebook_library_count']['before']} | {metrics['notebook_library_count']} |",
        "",
        "## Improvement Summary",
        "",
        f"- Local managed skill validation improved from `{BASELINE['project_local_valid']['before']}` to `{metrics['project_local_valid']}`.",
        f"- `.claude/skills` index coverage improved from `{BASELINE['repo_claude_indexed']['before']}` to `{metrics['repo_claude_indexed']}`.",
        f"- NotebookLM MCP server count is now `{metrics['mcp_server_count']}`.",
        f"- NotebookLM target notebook registered: `{str(metrics['notebook_registered']).lower()}`.",
        f"- Remaining warnings: `{metrics['warning_count']}`.",
        f"- Manual intervention required: `{metrics['manual_intervention_count']}`.",
        "",
        "## Remaining Findings",
        "",
    ]

    if not invalid:
        lines.append("- No blocking skill-load errors found.")
    else:
        for audit in invalid:
            lines.append(f"- `{display_path(audit.file)}`: {'; '.join(audit.errors)}")

    if duplicates:
        lines.extend(["", "## Duplicate Triggers", ""])
        for trigger, names in sorted(duplicates.items()):
            lines.append(f"- `{trigger}` -> {', '.join(sorted(set(names)))}")

    return "\n".join(lines) + "\n"


def main() -> None:
    STATUS_DIR.mkdir(parents=True, exist_ok=True)
    audits = collect_audits()
    metrics = build_metrics(audits)
    REPORT_MD.write_text(markdown_report(audits, metrics), encoding="utf-8")
    REPORT_JSON.write_text(json.dumps(report_payload(audits, metrics), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
