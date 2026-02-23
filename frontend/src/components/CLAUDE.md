# frontend/src/components CLAUDE.md

## Role
- Shared component root.

## Do Not
1. Embed route-specific business logic in shared components.
2. Couple generic UI to a single domain flow.

## Dependencies
- domain/*: domain-specific reusable views
- layout/*: app shell pieces
- providers/*: context wrappers
- ui/*: generic primitives
