# Module: form-management
## Data Models
FormDefinition (form_id, tenant_id, title, fields[], status), FormSubmission (submission_id, form_id, responses[], status)
## Events Published
FormPublished, FormSubmitted
## Permissions
form:definition:create, form:definition:read, form:definition:publish, form:submission:create, form:submission:read
## Database
MongoDB
