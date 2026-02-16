# GraphQL Schema Agent

> Type: Cross-cutting (invoked during Phase 2–3) — Automate schema.graphql management when modules add or change types and operations

When invoked: After the Architect defines new types (Phase 2) or a vertical agent adds operations (Phase 3), ensure the root schema and module GraphQL files are updated so that all Query and Mutation fields are present, types are consistent, and .cursor/rules/graphql-conventions.mdc is satisfied.

## Context (read in order)
1. Read **src/appsync/schema/schema.graphql** (default app) or **schema.<app>.graphql** (per-app) — root Query and Mutation type definitions and all types.
2. Read each module's **src/core-modules/<module>/graphql and src/app-modules/<module>/graphql/*.graphql** — extend type Query, extend type Mutation, and type definitions.
3. Read **.cursor/rules/graphql-conventions.mdc** — Connection types for lists, AWSDateTime, AWSJSON, mutations return full object.

## When to invoke
- **After Phase 2 (Design)**: Architect has written MODULE.md with new GraphQL types and operations; add or update module .graphql file and ensure root schema includes the new fields.
- **After Phase 3 (Implement)**: Vertical agent added a new resolver and handler case; add the field to the module's extend type Query/Mutation and to the root schema if not already there.

## Actions for new module
1. Create or update **src/core-modules/<module>/graphql and src/app-modules/<module>/graphql/<module>.graphql** (or one .graphql file per module) with:
   - `extend type Query { ... }` for every query field (getX, listX).
   - `extend type Mutation { ... }` for every mutation field (createX, updateX, etc.).
   - All types used (input types, connection types, enums).
2. Ensure the root schema (src/appsync/schema/schema.graphql or schema.<app>.graphql for multi-app) includes every field from every module. Run **scripts/merge-graphql.sh** to regenerate the default root schema, or **scripts/merge-graphql.sh --app <app-name>** to regenerate schema.<app>.graphql from the modules enabled for that app. The merge script flattens all `extend type Query` and `extend type Mutation` blocks into single root type definitions in the output for AWS AppSync compatibility.

## Actions for new operation
1. Add the field to the module's **extend type Query** or **extend type Mutation** in its .graphql file.
2. Ensure the root schema includes the field: either add to root **schema.graphql** / **schema.<app>.graphql** if maintained explicitly, or run **scripts/merge-graphql.sh** [--app <app>] to regenerate the root schema from modules.

## Validation (graphql-conventions.mdc)
- **List operations**: Return a Connection type with `items` and `nextCursor` (or PageInfo).
- **Scalars**: Use AWSDateTime for timestamps, AWSJSON for flexible payloads.
- **Mutations**: Return the full object type, not only ID.
- **No duplicate type definitions**: The same type name must not be defined twice (extend is fine).

## Output
- Produce a **diff** of schema.graphql and/or module .graphql changes.
- After editing, run **scripts/merge-graphql.sh** to regenerate the default root schema, or **scripts/merge-graphql.sh --app <app-name>** for per-app schema.<app>.graphql (script will warn on duplicate types or missing Connection if enhanced).
