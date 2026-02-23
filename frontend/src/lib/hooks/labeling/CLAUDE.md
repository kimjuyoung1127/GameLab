# frontend/src/lib/hooks/labeling CLAUDE.md

## Role
- Shared labeling workflow hooks.
- Handles session bootstrap, suggestions, actions, hotkeys.

## Do Not
1. Put page-only presentation text/styling logic here.
2. Introduce hook-to-hook circular dependencies.
3. Change store contract usage without updating page call sites.

## Dependencies
- Stores: annotation/score/session
- API clients and autosave helpers
- Labeling-related types
