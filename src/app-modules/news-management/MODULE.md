# Module: news-management

## Data Models
(news_id, constituency, ward, dateTime, information, incidentType, imageUrl, createdBy, createdAt, updatedAt)

## GraphQL Schema
(Queries: getNews(news_id), listNews(filters, pagination)

Mutations: createNews, updateNews, deleteNews)

## Events Published
(NewsCreated

NewsUpdated

NewsDeleted)

## Events Consumed
(None (no external EventBridge subscriptions))

## Permissions
(news:news:read

news:news:list

news:news:create

news:news:update

news:news:delete)

## Dependencies
(User (createdBy sourced from authenticated user context))

## Database Choice
(MongoDB (Mongoose). Flexible document model suitable for dynamic civic news records with indexing on constituency, ward, dateTime, and incidentType for efficient filtering.)
