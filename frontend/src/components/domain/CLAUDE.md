# frontend/src/components/domain CLAUDE.md

## Role
- Domain-focused reusable components.

## Do Not
1. Cross-import unrelated domain components by convenience.
2. Add API fetching directly in presentational components.

## Dependencies
- @/types/*
- @/lib/hooks/* as needed

## Subagent Hook
- Before creating a new domain feature folder or expanding one across multiple routes, run `subagent-pattern-collect` in `feature-module` mode.
