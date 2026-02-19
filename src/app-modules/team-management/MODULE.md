# Module: team-management

## Data Models
(team_id, name, constituency, ward, group, category, role, remarks, contact, childId, status, createdBy, createdAt, updatedAt)

## GraphQL Schema
(Queries:

getTeam(team_id)

listTeams(filters, search, sort, pagination)

Mutations:

createTeam

updateTeam

deleteTeam (soft delete – updates status to DELETED))

## Events Published
(TeamCreated

TeamUpdated

TeamDeleted)

## Events Consumed
(None (no external EventBridge subscriptions))

## Permissions
(team:team:read

team:team:list

team:team:create

team:team:update

team:team:delete)

## Dependencies
(User (createdBy stored as Mongo ObjectId of authenticated user)

Common middleware (auth-guard, tenant-resolver, validation, event-publisher))

## Database Choice
(MongoDB (Mongoose).

Document-based model supports flexible team structures across constituencies and wards. Indexed fields include constituency, ward, group, category, role, and status to support efficient filtering and listing operations. Logical team_id is used as primary business identifier, separate from Mongo _id for consistency across modules)
