# frontend/src/lib/api CLAUDE.md

## Role
- Typed API clients for backend endpoints.

## Do Not
1. Duplicate endpoint strings outside endpoint definitions.
2. Return untyped ny payloads.
3. Swallow API errors silently.

## Dependencies
- Endpoint map module.
- Domain types from @/types/*.
- Backend API contracts must stay mirrored.
