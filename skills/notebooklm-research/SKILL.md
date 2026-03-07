---
name: notebooklm-research
description: Source-grounded research workflow for NotebookLM URLs, notebook-backed documentation queries, and MCP-driven follow-up analysis. Use when a task includes a NotebookLM URL, asks to query notebook contents, register a notebook, or persist grounded notes before implementation.
---

# NotebookLM Research

## Trigger
- User provides a NotebookLM URL.
- User asks to "query NotebookLM", "use notebook docs", or "research this notebook before coding".
- The task needs source-grounded answers before implementation.

## Read First
1. `../../docs/ref/NOTEBOOKLM-MCP-RUNBOOK.md`
2. `../CLAUDE.md`
3. `../../docs/ref/notebooklm/6a8491af-e793-4574-8182-9ab2511fbbe3.md` when the provided notebook matches the GameLab shared notebook

## Input Context
- Notebook URL or notebook ID
- Research question or implementation target
- Expected output path if the user wants notes persisted

## Do
1. Confirm the `notebooklm` MCP server is configured and the toolset includes `get_health`, `list_notebooks`, `add_notebook`, `select_notebook`, and `ask_question`.
2. If authentication is missing, stop and ask the user to complete NotebookLM browser login before claiming any notebook content.
3. Register the notebook if it is not already in the library.
4. Select the notebook before asking implementation questions.
5. Ask an initial question set:
   - notebook overview
   - concepts relevant to the current task
   - constraints or failure modes
   - implementation details still missing
6. Ask follow-up questions until the notebook answer covers the task, or explicitly states the information is unavailable.
7. Persist a concise summary to `../../docs/ref/notebooklm/<notebook-id>.md` when the task needs a reusable reference.
8. Append a machine-readable entry to `../../memory/notebooklm-runs.ndjson` with notebook ID, question scope, and status.

## Do Not
- Do not pretend NotebookLM content was retrieved if authentication or sharing blocks access.
- Do not replace repo source-of-truth docs with notebook notes.
- Do not store secrets, tokens, or copied raw proprietary content in the repo.

## Validation
- NotebookLM MCP is configured.
- Notebook selection is explicit before question asking.
- Follow-up questions were used when the first answer was incomplete.
- Any saved note includes source URL, sync status, and open gaps.

## Output
```text
[notebooklm-research]
- notebook: <id or url>
- status: success | blocked-auth | blocked-sharing | partial
- questions: <count>
- saved_ref: <path or none>
- log_appended: yes | no
- open_gaps: <summary>
```
