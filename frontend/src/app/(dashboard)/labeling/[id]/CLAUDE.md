# frontend/src/app/(dashboard)/labeling/[id] CLAUDE.md

## Role
- Labeling workspace orchestration route.
- Composes panels/components and connects hooks/stores.

## Do Not
1. Grow `page.tsx` back into a monolith.
2. Keep side-effect heavy logic directly in page body.
3. Duplicate status/tool constants across files.

## Dependencies
- UI: `components/*`
- Shared hooks: `@/lib/hooks/labeling/*`
- Stores: `@/lib/store/*`
- Styles: `styles/page.module.css`
