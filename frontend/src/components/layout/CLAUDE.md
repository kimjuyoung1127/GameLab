# frontend/src/components/layout CLAUDE.md

## Role
- Shell-level layout components (sidebar/topbar/modals).

## Do Not
1. Embed feature-specific business logic.
2. Trigger network calls directly from layout primitives.

## Dependencies
- UI stores (@/lib/store/ui-store, auth store where needed).
