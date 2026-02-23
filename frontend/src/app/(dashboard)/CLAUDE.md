# frontend/src/app/(dashboard) CLAUDE.md

## Role
- Dashboard route group for feature pages.
- Provides shared shell context across dashboard routes.

## Do Not
1. Duplicate feature logic across route pages.
2. Recreate shared hooks under route folders.
3. Put page-specific styles into group-level style files.

## Dependencies
- Layout: @/components/layout/*
- Logic: @/lib/hooks/*, @/lib/store/*
"@ }
    'frontend/src/app/(dashboard)/labeling' { return @"
# frontend/src/app/(dashboard)/labeling CLAUDE.md

## Role
- Namespace for labeling route(s).

## Do Not
1. Implement screen logic directly at this level.
2. Duplicate [id] implementation in sibling files.

## Dependencies
- Real implementation belongs to [id]/ subtree.
