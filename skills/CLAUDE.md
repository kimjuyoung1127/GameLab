# skills/

Shared project skills for cross-client workflows.

## Structure
- `ai-session-ops/` for session logging and operational continuity
- `code-quality-guard/` for implementation guardrails and safety checks
- `code-review-protocol/` for structured review workflows
- `frontend-design/` for high-quality UI implementation
- `fullstack-mirror-arch/` for backend/frontend mirror discipline
- `gptapp-dev/` for ChatGPT Apps SDK and MCP app work
- `notebooklm-research/` for NotebookLM MCP-backed research and notebook syncing

## Rules
- Prefer `skills/` when the workflow should remain portable across Claude, Codex, and Gemini-style clients.
- Keep project-specific orchestration in `.claude/skills/` and reusable cross-client research workflows in `skills/`.
- If a skill depends on MCP, document the required server and tool names in the skill body.
