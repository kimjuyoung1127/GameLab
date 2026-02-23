# frontend/src/lib/store CLAUDE.md

## Role
- Zustand stores for global client state.

## Do Not
1. Import UI components into stores.
2. Put fetch/navigation side effects directly in store modules.
3. Couple stores to each other without clear interface.

## Dependencies
- Types from @/types/*.
- Consumed by hooks/pages/components.
