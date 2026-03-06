# skill-doc-integrity - skill inventory and structure check

## Meta
- Task: GameLab skill inventory integrity scan
- Schedule: Daily 03:00 (Asia/Seoul)
- Role: Verify that skill files, matrix/index registration, and referenced paths stay aligned
- Project root: `C:\Users\gmdqn\gamelab\GameLab`

## Validation Surface
```text
docs/status/SKILL-DOC-MATRIX.md
  -> page skill rows
  -> ops skill rows

.claude/skills/**/SKILL.md
  -> actual skill files

.claude/skills/CLAUDE.md
  -> skill index registration

docs/status/PAGE-UPGRADE-BOARD.md
  -> page_skill and support_skills references
```

## Lock
- Lock file: `docs/status/.skill-doc-integrity.lock`
- On start write `{"status":"running","started_at":"<ISO>"}`
- On finish write `{"status":"released","released_at":"<ISO>"}`

## Ops Skills That Must Be Tracked
- `pre-commit-validate`
- `subagent-doc-check`
- `subagent-pattern-collect`

## Procedure

### Step 0 - Pre-check
1. Acquire the lock.
2. Confirm `DRY_RUN`.

### Step 1 - Parse skill matrix
1. Read `docs/status/SKILL-DOC-MATRIX.md`.
2. Extract page skill rows and ops skill rows.
3. Build `matrix_skills` and `matrix_ops_skills`.

### Step 2 - Scan disk skills
1. Read `.claude/skills/**/SKILL.md`.
2. Build `disk_skill_names`.
3. Compute:
   - `MISSING_SKILL = matrix_skills - disk_skill_names`
   - `UNTRACKED_SKILL = disk_skill_names - matrix_skills`
4. Treat `subagent-doc-check` and `subagent-pattern-collect` as required ops skills, not optional extras.

### Step 3 - Validate board references
1. Parse `docs/status/PAGE-UPGRADE-BOARD.md`.
2. Extract `page_skill` and `support_skills`.
3. Record:
   - `BOARD_DANGLING` for skills referenced by board but missing on disk
   - `BOARD_UNMATRIX` for skills referenced by board but missing from matrix

### Step 4 - Validate skill file structure
1. For every `SKILL.md`, confirm frontmatter includes:
   - `name`
   - `description`
2. Confirm body structure:
   - page/feature skills: `Trigger`, `Read First` or `Input Context`, `Do` or `Procedure`, `Validation`
   - ops/subagent skills: `Trigger`, `Read First` or `Input Context`, `Procedure`, `Validation`, `Output`
3. Record `INCOMPLETE_SKILL` for missing sections.

### Step 5 - Validate referenced paths
1. Extract repo-relative file paths from every `SKILL.md`.
2. Verify referenced files/directories exist.
3. Record `BROKEN_PATH` for each missing reference.
4. Flag stale imported source-project paths as `STALE_IMPORTED_PATH`.

### Step 6 - Report
1. If `DRY_RUN=true`, print report body only.
2. Otherwise write `docs/status/SKILL-DOC-INTEGRITY-REPORT.md` with counts and detail tables.

### Step 7 - Release
1. Release the lock file.

## Must Not
- Do not edit skill files from this automation.
- Do not edit `SKILL-DOC-MATRIX.md` automatically.
- Do not edit board rows automatically.
- Only report drift.

## DRY_RUN=true
- Print report content only.
- Final line: `[DRY_RUN] no files changed`
