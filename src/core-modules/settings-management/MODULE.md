# settings-management

Manages tenant-scoped configuration settings (security policies, operational parameters).

## Operations

| Field          | Type     | Permission                  | Description                       |
|----------------|----------|-----------------------------|-----------------------------------|
| getSettings    | Query    | settings:setting:read       | List all settings, optionally filtered by category |
| updateSetting  | Mutation | settings:setting:update     | Update a single setting by key    |
| updateSettings | Mutation | settings:setting:update     | Bulk-update multiple settings     |

## Schema

`setting.model.js` — compound unique index on `(tenant_id, key)`.

## Seeding

Run `node scripts/seed-roles.js` after first deploy to create default settings and system roles.
