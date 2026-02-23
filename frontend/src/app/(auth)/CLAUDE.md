# frontend/src/app/(auth) CLAUDE.md

## Role
- Auth route group.
- Hosts authentication entry and related UX.

## Do Not
1. Put dashboard business UI in this group.
2. Hardcode auth bypass logic in production paths.

## Dependencies
- @/lib/supabase/*
- @/lib/store/auth-store
"@ }
    'frontend/src/app/(auth)/login' { return @"
# frontend/src/app/(auth)/login CLAUDE.md

## Role
- Login page and sign-in entry flow.

## Do Not
1. Hardcode API URLs in page logic.
2. Keep long static styling in TSX; use CSS modules.
3. Duplicate session handling logic inside UI blocks.

## Dependencies
- Auth: @/lib/supabase/*, @/lib/store/auth-store
- Styling: styles/page.module.css
- Text: @/i18n where available
