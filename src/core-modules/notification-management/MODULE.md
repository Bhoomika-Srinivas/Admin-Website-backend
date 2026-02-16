# Module: notification-management

## Data Models
- NotificationTemplate, Notification, NotificationPreference
## Events Published
None (sends via SES/SNS).
## Events Consumed
UserInvited, TenantCreated, FormSubmitted, WorkflowStepCompleted
## Permissions
notification:template:create, notification:template:read, notification:notification:read, notification:preference:update
## Database
MongoDB
