# GameLab Schema Reference

Last updated: 2026-02-12 (KST)
Source: Supabase MCP DDL extraction

## Project
- Name: `signalcraft`
- Project ID: `zlcnanvidrjgpuugbcou`
- Region: `ap-northeast-2` (Seoul)
- DB: `PostgreSQL 17.6.1`
- Health: `ACTIVE_HEALTHY`

## Public Schema Tables (Current Snapshot)
| table | rls | row_count |
|---|---|---:|
| devices | enabled | 7 |
| daily_reports | enabled | 56 |
| forecasts | enabled | 7 |
| incidents | enabled | 0 |
| machine_event_logs | enabled | 6 |
| maintenance_logs | enabled | 8 |
| telemetry_logs | enabled | 0 |
| notifications | enabled | 4 |
| notification_settings | enabled | 1 |
| service_tickets | enabled | 0 |
| sound_logs | enabled | 0 |
| sst_sessions | enabled | 7 |
| sst_audio_files | enabled | 2 |
| sst_suggestions | enabled | 2 |
| sst_users | enabled | 5 |
| sst_jobs | enabled | 0 |
| goertzel_test_monitor | enabled | 0 |

---

## Sprint 12.2 Target Tables DDL

### 1) `sst_sessions`

| column | type | nullable | default |
|--------|------|----------|---------|
| `id` | text | NO | — |
| `name` | text | NO | — |
| `device_type` | text | NO | `'Unknown'` |
| `status` | text | NO | `'pending'` |
| `file_count` | integer | NO | `0` |
| `progress` | integer | NO | `0` |
| `score` | numeric | YES | — |
| `created_at` | timestamptz | NO | `now()` |

**PK:** `id`
**CHECK:** `status IN ('pending', 'processing', 'completed')`
**CHECK:** `progress >= 0 AND progress <= 100`
**FK references:** `sst_audio_files.session_id -> sst_sessions.id`

---

### 2) `sst_audio_files`

| column | type | nullable | default |
|--------|------|----------|---------|
| `id` | text | NO | — |
| `session_id` | text | NO | — |
| `filename` | text | NO | — |
| `duration` | text | NO | `'00:00:00'` |
| `sample_rate` | text | NO | `'Unknown'` |
| `status` | text | NO | `'pending'` |
| `audio_url` | text | YES | — |
| `created_at` | timestamptz | NO | `now()` |

**PK:** `id`
**FK:** `session_id -> sst_sessions.id`
**CHECK:** `status IN ('pending', 'processing', 'completed', 'failed')`
**FK references:** `sst_suggestions.audio_id -> sst_audio_files.id`

---

### 3) `sst_suggestions`

| column | type | nullable | default |
|--------|------|----------|---------|
| `id` | text | NO | — |
| `audio_id` | text | NO | — |
| `label` | text | NO | `'Suggestion'` |
| `confidence` | integer | NO | `0` |
| `description` | text | NO | `''` |
| `start_time` | double precision | NO | `0` |
| `end_time` | double precision | NO | `0` |
| `freq_low` | integer | NO | `0` |
| `freq_high` | integer | NO | `0` |
| `status` | text | NO | `'pending'` |
| `created_at` | timestamptz | NO | `now()` |
| `updated_at` | timestamptz | YES | `now()` |

**PK:** `id`
**FK:** `audio_id -> sst_audio_files.id`
**CHECK:** `status IN ('pending', 'confirmed', 'rejected', 'corrected')`
**CHECK:** `confidence >= 0 AND confidence <= 100`
**Indexes:**
- `idx_suggestions_audio` ON `(audio_id)`
- `idx_sst_suggestions_audio_status` ON `(audio_id, status)` ← Sprint 12.2 추가

---

### 4) `sst_users`

| column | type | nullable | default |
|--------|------|----------|---------|
| `id` | text | NO | — |
| `name` | text | NO | — |
| `email` | text | NO | — |
| `role` | text | NO | `'junior_tagger'` |
| `avatar` | text | YES | — |
| `today_score` | integer | NO | `0` |
| `accuracy` | numeric | NO | `0` |
| `all_time_score` | integer | NO | `0` |
| `created_at` | timestamptz | NO | `now()` |

**PK:** `id`

---

### 5) `sst_jobs`

| column | type | nullable | default |
|--------|------|----------|---------|
| `id` | text | NO | — |
| `status` | text | NO | `'queued'` |
| `progress` | float8 | NO | `0` |
| `session_id` | text | YES | — |
| `file_count` | integer | YES | — |
| `error` | text | YES | — |
| `created_at` | timestamptz | NO | `now()` |
| `updated_at` | timestamptz | NO | `now()` |

**PK:** `id`

**FK:** `session_id -> sst_sessions.id (ON DELETE CASCADE)`

**Indexes:** `idx_sst_jobs_session(session_id)`, `idx_sst_jobs_status(status)`

**Status values:** `idle`, `uploading`, `queued`, `processing`, `done`, `failed`

---

### 6) RPC/Functions

#### `create_upload_session_with_files(p_session, p_files, p_suggestions)`
- Atomically inserts into `sst_sessions`, `sst_audio_files`, `sst_suggestions`
- Used by `backend/app/api/upload/router.py`
- Source: `scripts/sql-chunks/create_upload_session_with_files.sql`

---

## Applied Migrations (Sprint 12.2)

1. **`add_suggestions_updated_at`** — Added `updated_at timestamptz DEFAULT now()` to `sst_suggestions`
2. **`add_suggestions_audio_status_index`** — Created composite index `idx_sst_suggestions_audio_status(audio_id, status)`

## Verification Checklist
- [x] DDL for all `sst_*` tables documented
- [x] Constraints and indexes confirmed
- [x] `updated_at` column added to `sst_suggestions`
- [x] Composite index `(audio_id, status)` applied
- [x] API compatibility checked against routers
