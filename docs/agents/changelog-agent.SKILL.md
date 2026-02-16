# Changelog Agent

> Type: Utility Agent — runs after every code-modifying prompt AND as Phase 8 of the full pipeline

When invoked: Update project documentation to reflect changes made in the current session. Maintain docs/CHANGELOG.md and keep README.md and docs/PRODUCT.md in sync with the actual module list. **Whenever there is an approved code change** (after a pipeline phase gate or a lightweight pipeline run), update the README as needed so it always reflects the current project structure and behavior.

## Context
1. Read docs/CHANGELOG.md (current entries).
2. Read README.md (project structure and module list).
3. Read docs/PRODUCT.md (Core Modules Used, Custom Modules).
4. Determine what changed in this session: modules added/modified/removed, features, events, permissions, GraphQL operations.

## docs/CHANGELOG.md
- Append a new entry at the top (reverse-chronological).
- Use format:
  - **## [YYYY-MM-DD] — <brief title>**
  - **Added**: <module>: <what was added>
  - **Changed**: <module>: <what changed>
  - **Removed**: <module>: <what was removed>
  - **Events**: New/Removed <source> → <DetailType>
  - **Permissions**: New/Removed <permission string>
- Never remove or rewrite previous entries.
- If nothing changed in this session, do not add an empty entry.

## README.md
- **On every approved code change**: Update README.md so it reflects the current codebase (project structure, module list, workflows, scripts).
- If modules were added: add them to the project structure tree and any module list.
- If modules were removed: remove them from the project structure tree and module list.
- Keep "Adding a Module", "Project Structure", and "Agent Workflow" sections accurate.

## docs/PRODUCT.md
- If custom modules were added: append to the Custom Modules section.
- If custom modules were removed: remove from the Custom Modules section.
- If core modules were removed (e.g. via remove-module): uncheck in Core Modules Used.

## Rules
- Be concise but specific: mention module names, event types, GraphQL operation names.
- Skip adding a changelog entry if no code or module structure changed.
