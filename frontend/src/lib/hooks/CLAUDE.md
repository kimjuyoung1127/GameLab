# frontend/src/lib/hooks CLAUDE.md

## Role
- Shared client hooks.

## Do Not
1. Return JSX from hooks.
2. Duplicate near-identical hooks under route folders.
3. Mix unrelated concerns into one mega-hook.

## Dependencies
- Uses stores and types.
- Domain-specific hooks live in subfolders like labeling.
