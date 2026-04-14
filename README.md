# College Department Management — Backend (AWS SAM)

Multi-tenant backend for a college website and admin panel. Built on AWS SAM with AppSync (GraphQL) + Lambda + MongoDB. Each department is a tenant; two roles: **super_admin** (full access) and **dept_admin** (department-scoped access).

---

## Product Overview

**Domain**: College/University department management — public-facing website content + internal admin panel for departments.

**Tenants**: One per college (e.g. `biet-college`).

**Roles**:
| Role | Permissions | Event Auto-Approval |
|------|-------------|-------------------|
| `super_admin` | `*:*:*` | Yes |
| `dept_admin` | Per-module wildcards | No (pending → approve flow) |

---

## Modules

### Core Modules (`src/core-modules/`)
| Module | Purpose |
|--------|---------|
| `tenant-management` | College tenant CRUD, plan, status |
| `user-management` | Users, roles, permissions; Cognito PreSignUp / PostConfirmation / PreTokenGeneration triggers |
| `audit-log` | Consumes all EventBridge events; persists audit trail |
| `notification-management` | Notification templates and delivery |
| `storage-management` | S3 file upload/download (images, PDFs, attachments) |
| `form-management` | Dynamic form definitions and submissions |
| `workflow-management` | Approval workflows |

### App Modules (`src/app-modules/`)
| Module | Key Entities |
|--------|-------------|
| `department-management` | Department CRUD, basic info |
| `dept-info-management` | Department about, vision/mission, accreditations, highlights |
| `dept-branding-management` | Logo, banners, theme colors |
| `dept-people-management` | Students, non-teaching staff, HOD |
| `dept-academics-management` | DeptBatch → DeptSection → DeptSlot (timetable), DeptCourse, DeptTimetable, LearningMaterial, InnovativeTeaching, ResultAnalysis |
| `dept-research-management` | Research projects, PhD scholars, publications |
| `dept-activities-management` | PlacementOverview, StudentPlacement, Achievement, DeptActivity, ForumSection, ForumEvent, DepartmentActivityLog, Newsletter, GalleryPhoto |
| `faculty-management` | Faculty profiles |
| `alumni-management` | Alumni records |
| `events-management` | Institutional/department events; approval workflow; auto-status (upcoming → completed) |

---

## Course & Timetable Hierarchy

```
Department
  └── ProgramType (UG / PG)
        └── Program (BE / MCA / MBA ...)
              └── Semester (1–8)
                    └── Batch (e.g. 2021-25)
                          └── Courses
                                └── Section → Slots (timetable)
```

`DeptBatch`, `DeptCourse`, and `DeptSlot` all carry `programType`, `program`, and `batch` for direct filtering.

---

## Events Module

- `level`: `institutional` | `department`
- `isMultiDay`: `false` → uses `date` + `time`; `true` → uses `startDate` + `startTime` + `endDate` + `endTime`
- `approvalStatus`: auto-`approved` for `super_admin`, `pending` for `dept_admin`
- `status`: auto-transitions `upcoming` → `completed` when event date passes (checked on `listEvents`)

---

## Auth Flow

1. User signs in via **Cognito User Pool**
2. **PreTokenGeneration** Lambda reads user's roles from MongoDB → injects `custom:permissions` into ID token
3. Every Lambda reads `custom:permissions` from token via `resolveTenant()` → `requirePermission()` checks against required permission string (`module:resource:action`, wildcards supported)

---

## Project Structure

```
├── src/
│   ├── layers/
│   │   ├── common/          # middleware (tenant-resolver, auth-guard, input-validator, with-connection, request-logger)
│   │   │                    # utils (id-generator, pagination, event-publisher)
│   │   │                    # db (mongo-repository)
│   │   └── packages/        # npm deps (mongoose, AWS SDK v3)
│   ├── core-modules/        # tenant, user, audit-log, notification, storage, form, workflow
│   └── app-modules/         # department, dept-info, dept-branding, dept-people, dept-academics,
│                            # dept-research, dept-activities, faculty, alumni, events
├── stacks/
│   ├── infrastructure.yaml  # Layers, EventBus, Cognito, AppSync, S3, SQS
│   ├── core/                # One .yaml per core module
│   └── app/                 # One .yaml per app module
├── src/appsync/schema/      # Merged schema.graphql (generated — do not edit directly)
├── app-config.yaml          # Which modules are active (source of truth for template composition)
├── template.yaml            # Composed SAM template (generated — do not edit directly)
├── scripts/
│   ├── compose-template.sh
│   ├── merge-graphql.sh
│   ├── generate-module.sh
│   ├── seed-dept-activities.js
│   ├── seed-phd-scholars.js
│   └── seed-research.js
├── tests/
│   ├── helpers/             # mock-layer.js, test-context.js
│   └── unit/modules/        # handler.test.js per module
├── docs/
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   └── agents/
├── samconfig.toml
└── package.json
```

---

## Getting Started

```bash
npm install
npm run build        # merge GraphQL + compose template + sam build
sam deploy --config-env default   # deploy dev
sam deploy --config-env prod      # deploy prod
```

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Merge GraphQL → compose template → validate → `sam build` |
| `npm run merge-graphql` | Merge all module `.graphql` files into `src/appsync/schema/schema.graphql` |
| `npm run compose-template` | Compose `template.yaml` from `app-config.yaml` + `stacks/` |
| `npm run validate-schemas` | Validate merged GraphQL schema |
| `npm test` | Run all Jest unit tests |
| `npm run test:unit` | Unit tests only |

---

## Adding a Module

```bash
bash scripts/generate-module.sh --type app --name <module-name>
```

Then implement `functions/handler.js`, `schemas/`, `graphql/`, and add resolvers. Run `npm run build`.

---

## Seed Scripts

```bash
node scripts/seed-dept-activities.js   # 40 forum events + 54 dept activity logs for DEP001/biet-college
node scripts/seed-phd-scholars.js      # PhD scholars seed data
node scripts/seed-research.js          # Research projects seed data
```

Requires `MONGODB_URI` in `.env`.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `STAGE` | `dev` / `staging` / `prod` |
| `PROJECT_NAME` | Project identifier (e.g. `myapp`) |
| `EVENT_BUS_NAME` | EventBridge custom bus name |
| `MONGODB_SSM_PARAM_NAME` | SSM path for MongoDB URI |
| `AWS_SAM_LOCAL` | Set `TRUE` for local dev; uses `MONGODB_URI` directly |

---

## Key Conventions

- **Permission format**: `module:resource:action` — e.g. `dept-academics:course:create`, `events:event:update`. Wildcards: `events:*:*`, `*:*:*`.
- **Primary keys**: Every document has a `<entity>_id` field (ULID) stored alongside `_id`. Repositories use this as `primaryKey`.
- **Tenant isolation**: Every query is scoped by `tenant_id` (from Cognito token `custom:tenant_id`).
- **Template**: `template.yaml` is **generated** — never edit directly. Edit `stacks/*.yaml` fragments instead.
- **GraphQL schema**: `src/appsync/schema/schema.graphql` is **generated** — never edit directly. Edit per-module `graphql/*.graphql` files.
