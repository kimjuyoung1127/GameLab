# frontend/src/app CLAUDE.md

## Role
- Next.js App Router entry layer.
- Owns route files, layouts, error boundaries, and globals.css.

## Do Not
1. Keep large business logic directly in page.tsx.
2. Put feature-specific UI rules into global CSS.
3. Mix route handlers with UI logic.

## Dependencies
- Uses @/components, @/lib, @/types, @/i18n.
- Feature styles should live in local styles/*.module.css.
