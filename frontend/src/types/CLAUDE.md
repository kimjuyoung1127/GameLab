# frontend/src/types CLAUDE.md

## Role
- Domain type source of truth for frontend.

## Do Not
1. Duplicate the same domain type in page/component files.
2. Change API-facing types without syncing callers.
3. Add runtime logic to type-only modules.

## Dependencies
- Referenced by app/components/lib layers.
- Must stay aligned with backend models/contracts.
