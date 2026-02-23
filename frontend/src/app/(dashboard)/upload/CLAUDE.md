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
"@
System.Collections.Hashtable['frontend/src/app/(dashboard)/overview'] = @"
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
"@
System.Collections.Hashtable['frontend/src/app/(dashboard)/sessions'] = @"
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
"@
System.Collections.Hashtable['frontend/src/app/(dashboard)/labeling/[id]'] = @"
# frontend/src/app/(dashboard)/labeling/[id] CLAUDE.md

## Role
- Labeling workspace orchestration route.
- Composes panels/components and connects hooks/stores.

## Do Not
1. Grow page.tsx back into a monolith.
2. Keep side-effect heavy logic directly in page body.
3. Duplicate status/tool constants across files.

## Dependencies
- UI: components/*
- Shared hooks: @/lib/hooks/labeling/*
- Stores: @/lib/store/*
- Styles: styles/page.module.css
"@
System.Collections.Hashtable['frontend/src/app/(dashboard)/labeling/[id]/components'] = @"
# frontend/src/app/(dashboard)/labeling/[id]/components CLAUDE.md

## Role
- Presentation components for labeling workspace.

## Do Not
1. Add API calls or store mutations inside visual components.
2. Recompute domain business rules in multiple components.

## Dependencies
- Props from page/hooks.
- Styles from ../styles/page.module.css.
