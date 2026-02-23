# frontend/src/app/(dashboard)/leaderboard CLAUDE.md

## Role
- Leaderboard page.

## Do Not
1. Recalculate backend ranking logic in UI.
2. Use untyped leaderboard payloads.

## Dependencies
- API: @/lib/api/leaderboard
- Types: @/types/leaderboard
- Styles: styles/page.module.css
"@ }
    'frontend/src/app/(dashboard)/overview' { return @"
# frontend/src/app/(dashboard)/overview CLAUDE.md

## Role
- Dashboard overview metrics page.

## Do Not
1. Hardcode metric formulas across multiple blocks.
2. Duplicate card rendering patterns.

## Dependencies
- API: @/lib/api/overview
- Types: @/types/overview
- Styles: styles/page.module.css
"@ }
    'frontend/src/app/(dashboard)/sessions' { return @"
# frontend/src/app/(dashboard)/sessions CLAUDE.md

## Role
- Sessions listing and progress page.

## Do Not
1. Duplicate session status mapping logic.
2. Keep API response shape assumptions without types.

## Dependencies
- API: @/lib/api/sessions
- Types: @/types/sessions
- Styles: styles/page.module.css
"@ }
    'frontend/src/app/(dashboard)/upload' { return @"
# frontend/src/app/(dashboard)/upload CLAUDE.md

## Role
- Upload and job creation page.

## Do Not
1. Reimplement file validation rules in multiple handlers.
2. Mix transport/job orchestration with UI rendering blocks.

## Dependencies
- API: @/lib/api/upload, @/lib/api/jobs
- Types: @/types/upload, @/types/common
- Styles: styles/page.module.css
"@ }
    'frontend/src/app/auth' { return @"
# frontend/src/app/auth CLAUDE.md

## Role
- Namespace for auth route handlers.

## Do Not
1. Add UI pages here.
2. Put business workflow logic in auth route handlers.

## Dependencies
- Child route handlers such as callback/route.ts.
