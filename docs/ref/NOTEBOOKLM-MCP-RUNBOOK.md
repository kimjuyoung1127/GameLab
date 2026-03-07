# NotebookLM MCP Runbook

NotebookLM MCP is the project-standard path for source-grounded research based on NotebookLM notebooks.

## Purpose
- Query notebook content before implementation when the task references a NotebookLM URL.
- Register shared notebooks once and reuse them across compatible clients.
- Persist distilled notes inside the repo without copying full notebook content.

## Project Configuration
- Project MCP file: `.mcp.json`
- NotebookLM server key: `notebooklm`
- Server command: `npx -y notebooklm-mcp@latest`
- Expected core tools:
  - `get_health`
  - `setup_auth`
  - `list_notebooks`
  - `add_notebook`
  - `get_notebook`
  - `select_notebook`
  - `ask_question`

## Auth Flow
1. Check server health.
2. If NotebookLM is unauthenticated, run `setup_auth`.
3. Complete Google login in the browser window.
4. Re-check health before any notebook query.

## Notebook Registration Flow
1. Use `list_notebooks` to check whether the notebook already exists.
2. If missing, register it with:
   - URL
   - stable name
   - concise description
   - topics/tags relevant to GameLab
3. Select the notebook explicitly before asking questions.

## Research Loop
1. Ask for notebook overview.
2. Ask for task-relevant concepts and constraints.
3. Ask for edge cases, failure modes, or implementation caveats.
4. Ask follow-up questions until either:
   - the task is covered, or
   - NotebookLM says the source does not contain the answer.

## Persistence Rules
- Save distilled notes to `docs/ref/notebooklm/<notebook-id>.md`.
- Append run metadata to `memory/notebooklm-runs.ndjson`.
- Record:
  - notebook URL
  - sync timestamp
  - auth/access status
  - questions asked
  - remaining gaps

## Client Rules
- Claude/Codex/Gemini-style clients should all use the same MCP server name: `notebooklm`.
- If the client cannot consume project `.mcp.json`, mirror the same command in the client-specific MCP config.
- Keep the notebook skill repo-local under `skills/notebooklm-research/` so the workflow stays portable.

## Failure Modes
- `blocked-auth`: Google login has not been completed.
- `blocked-sharing`: notebook URL is not accessible to the signed-in account.
- `empty-library`: no notebook registered yet.
- `partial-answer`: notebook answered, but the task still has unresolved gaps.

## Recovery
- Re-run auth if the browser session expired.
- Re-register notebook metadata if the library entry is missing.
- Keep partial findings in the repo, but mark them as incomplete until a successful synced run is recorded.
