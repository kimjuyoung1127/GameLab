# frontend/src/app/auth/callback CLAUDE.md

## Role
- OAuth callback route handler.

## Do Not
1. Render UI/JSX in callback route.
2. Hardcode redirect behavior in multiple places.

## Dependencies
- @/lib/supabase/server
- NextResponse
"@ }
    'frontend/src/app/styles' { return @"
# frontend/src/app/styles CLAUDE.md

## Role
- App-level scoped style modules (non-global helpers).

## Do Not
1. Put per-feature styles here.
2. Duplicate what globals.css already provides.

## Dependencies
- Used by app route files that need app-scope helper styles.
