# Module: development-management

## Data Models
(development_id, constituency, ward, ward_no, nameOfWork, type, location, year, amount_spent, amount_unit, status, imageUrl, view_on_tracker (boolean), createdBy, createdAt, updatedAt.)

## GraphQL Schema
(Queries: getDevelopment(development_id), listDevelopments(filters, pagination)

Mutations: createDevelopment, updateDevelopment, deleteDevelopment)

## Events Published
(DevelopmentCreated

DevelopmentUpdated

DevelopmentDeleted)

## Events Consumed
(None (currently does not subscribe to external EventBridge events))

## Permissions
(development:development:read

development:development:list

development:development:create

development:development:update

development:development:delete)

## Dependencies
(User (createdBy reference from auth context))

## Database Choice
(MongoDB (Mongoose). Flexible structure for civic development records with indexing on constituency, ward, year, and status for efficient filtering)

