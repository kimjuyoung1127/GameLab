# Claude Implementation Brief (Sprint 12.2)

Last updated: 2026-02-12 (KST)
Owner split:
- Claude: major implementation
- Codex: review, plan, docs, minor fixes

## Scope (Implement)
1. Pluggable analysis engine architecture
2. Hotkey rapid-input safe persistence
3. Supabase schema DDL extraction + migration updates
4. Large-file policy (1GB+) enforcement

## Core Requirements

### A) Backend API
- Add/strengthen `PATCH /api/labeling/suggestions/{suggestion_id}` (idempotent)
- Keep `POST /api/upload/files` fast-return
- Run analysis asynchronously after upload and update jobs status:
  - `queued -> processing -> done|failed`
- Standardize job error/progress payload in `GET /api/jobs/{job_id}`

### B) Analysis Plugin Path
- Route all analysis calls through:
  - `AnalysisService -> EngineRegistry -> Engine`
- Engine interface:
  - `AnalysisEngine.analyze(file_path, config) -> SuggestionDraft[]`
- Implementations:
  - `SoundLabV57Engine`
  - `RuleFallbackEngine`
- Env switch:
  - `ANALYSIS_ENGINE=soundlab_v57|rule_fallback`
- Remove placeholder suggestion creation from upload path.

### C) Frontend Reliability
- Add endpoint:
  - `endpoints.labeling.updateSuggestionStatus(suggestionId)`
- Add action queue for hotkey spam safety:
  - fields: `requestId`, `suggestionId`, `targetStatus`, `clientTs`, `retryCount`
- Behavior:
  - optimistic UI update
  - serialized flush
  - coalesce repeated actions per same suggestion
  - offline retry queue on failure

### D) Large File Policy
- Enforce 1GB limit in both FE and BE
- Show user guidance:
  - split/chunk recordings
  - pre-convert to wav/mono/16kHz

## Schema Work (MCP)
Use Supabase MCP and fully extract DDL for:
- `sst_sessions`
- `sst_audio_files`
- `sst_suggestions`
- `sst_users`
- related indexes/policies/functions

Update:
- `docs/schema.md`

Add migrations (if needed):
1. `sst_suggestions.updated_at`
2. status constraint/index checks
3. composite index: `(audio_id, status)`

## Acceptance Tests
1. Hotkey spam:
- press `O` repeatedly (20x): final DB state consistent
- rapid `X -> F`: final state `corrected`

2. Upload flow:
- `.wav/.m4a/.mp3` upload works
- async jobs state transitions valid
- suggestions created after analysis
- >1GB blocked FE and BE

3. Engine swap:
- change env only; behavior switches without API/type break

4. Docs:
- `docs/schema.md` aligned with MCP DDL

## Paths To Touch
- Backend:
  - `backend/app/api/upload/router.py`
  - `backend/app/api/jobs/router.py`
  - `backend/app/api/labeling/router.py`
  - `backend/app/models/schemas.py`
  - `backend/app/core/config.py`
  - `backend/app/analysis/*` (new)
- Frontend:
  - `frontend/src/lib/api/endpoints.ts`
  - `frontend/src/lib/hooks/use-autosave.ts`
  - `frontend/src/app/(dashboard)/labeling/[id]/page.tsx`
  - `frontend/src/app/(dashboard)/upload/page.tsx`
  - `frontend/src/types/index.ts`
- Docs/SQL:
  - `docs/schema.md`
  - `scripts/sql-chunks/*.sql`
