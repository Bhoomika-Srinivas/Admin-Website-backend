# Module: workflow-management
## Data Models
WorkflowDefinition (workflow_id, trigger, steps[]), WorkflowInstance (instance_id, workflow_id, state, context, history[])
## Events Published
WorkflowStarted, WorkflowStepCompleted, WorkflowCompleted
## Events Consumed
Configurable per workflow (any project event)
## Permissions
workflow:definition:read, workflow:definition:create, workflow:instance:read, workflow:instance:approve
## Database
MongoDB
