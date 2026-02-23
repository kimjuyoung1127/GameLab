# frontend/src CLAUDE.md

## Role
- Root of frontend source code.
- Defines layer boundaries for app, components, lib, i18n, and types.

## Do Not
1. Mix absolute/relative imports inconsistently; prefer @/* alias.
2. Re-declare domain types in feature files.
3. Create import cycles across layers.

## Dependencies
- pp can depend on components, lib, 	ypes, i18n.
- lib must not depend on pp.
- 	ypes should be dependency-free.
