# CourseCompass

CourseCompass is a full-stack university course planning web application designed to help students explore courses, compare options, save courses, build semester plans, track completed courses, submit reviews, and receive AI-assisted course recommendations.

The project combines a Vue-based frontend, an Express and Prisma backend, a PostgreSQL database, and AI-powered semantic retrieval using vector embeddings.

---

## Features

### Course Discovery

- Browse available university courses
- View detailed course information
- Search courses by name and code
- Filter courses by semester, assessment type, credits, and level
- View course prerequisite relationships
- Compare multiple courses side by side
- View workload, credits, assessment information, and reviews

### User Accounts

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Password reset using email verification codes
- User profile information
- Role-based access control

Supported roles:

- Student
- Moderator
- Administrator

### Saved and Completed Courses

- Save courses for later
- Remove saved courses
- Track completed courses
- Use completed courses when checking prerequisites

### Semester Planning

- Create named semester plans
- Add courses directly to a semester plan
- Import saved courses into an existing plan
- Remove courses from plans
- Review planned credits and workload
- Receive prerequisite warnings when adding courses

### Reviews and Moderation

Students can submit course reviews containing:

- Overall rating
- Difficulty rating
- Workload rating
- Teaching rating
- Usefulness rating
- Assessment style
- Written comments

The moderation system supports:

- Pending reviews
- Approved reviews
- Rejected reviews
- Hidden reviews
- Review reporting
- Review report resolution and dismissal

### AI Features

CourseCompass includes:

- Semantic course search
- AI-powered course recommendations
- AI-generated course review summaries
- PostgreSQL `pgvector` storage
- 1024-dimensional course embeddings
- Structured database filters combined with semantic retrieval

### Notifications

CourseCompass includes persistent in-app notifications.

Notifications can be created for events including:

- Review-related activity
- Review reports
- Saved-course changes
- Planner changes

The notification system supports:

- Unread notification count
- Automatic refresh
- Marking individual notifications as read
- Marking all notifications as read
- Deleting individual notifications
- Deleting notifications in bulk
- Persistent PostgreSQL storage

---

# Tech Stack

## Frontend

- Vue 3
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios

## Backend

- Node.js
- Express
- Prisma ORM
- JWT
- bcrypt
- Nodemailer

## Database

- PostgreSQL
- Supabase-hosted shared database
- Prisma migrations
- pgvector

## AI

- SiliconFlow
- `BAAI/bge-m3`
- Zhipu AI
- Vector embeddings
- Cosine similarity
- Semantic retrieval

---

# Repository Structure

```text
courseCompass/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── lib/
│   │
│   ├── docs/
│   │   └── database/
│   │       ├── database-requirements.md
│   │       ├── decisions.md
│   │       ├── service-contracts.md
│   │       ├── erd-v0.1.drawio
│   │       ├── erd-v0.2.drawio
│   │       └── coursecompass-final-erd.svg
│   │
│   ├── scripts/
│   ├── tests/
│   ├── app.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
```

---

# Typical Student Workflow

1. Open **Courses** to browse or search the course catalogue.
2. Open a course to view details, prerequisites, assessments, workload, and reviews.
3. Use **Save Course** to keep interesting courses for later.
4. Use **Compare** to compare courses side by side.
5. Use **Add to Planner** to place a course into a semester plan.
6. Open **Planner** to review semester workload and credits.
7. Mark previously completed courses so prerequisite checking can use them.
8. Use AI search or recommendations to discover courses based on interests and requirements.

Saved courses are an optional shortlist and are not required before adding courses to a semester plan.

---

# Prerequisites

Before running CourseCompass locally, install or configure:

- Node.js 18 or newer
- npm
- PostgreSQL database access
- SiliconFlow API key
- Zhipu AI API key
- SMTP credentials for password-reset email

---

# Environment Variables

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

JWT_SECRET="replace-with-a-secure-secret"

ZHIPU_API_KEY="replace-with-your-zhipu-api-key"

SILICONFLOW_API_KEY="replace-with-your-siliconflow-api-key"
SILICONFLOW_EMBEDDING_MODEL="BAAI/bge-m3"
SILICONFLOW_EMBEDDING_URL="https://api.siliconflow.cn/v1/embeddings"

AI_SIMILARITY_THRESHOLD="0.35"

SMTP_HOST="smtp.example.com"
SMTP_PORT="465"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-app-password"
```

Create or update:

```text
frontend/.env.development
```

Example:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_USE_MOCK="false"
```

## Security

Never commit real secrets.

Do not commit:

```text
.env
```

Do not expose the following values in frontend code:

- `DATABASE_URL`
- `JWT_SECRET`
- `ZHIPU_API_KEY`
- `SILICONFLOW_API_KEY`
- SMTP credentials

Only placeholder or example credentials should appear in committed documentation.

---

# Install Dependencies

## Backend

```powershell
cd backend
npm install
```

## Frontend

```powershell
cd frontend
npm install
```

---

# Database Architecture

CourseCompass uses PostgreSQL as its relational database and Prisma as the main database access layer.

The shared project database is hosted on Supabase.

Database schema changes are version-controlled through:

```text
backend/prisma/migrations/
```

The Prisma schema is located at:

```text
backend/prisma/schema.prisma
```

---

# Final Database ERD

The following ERD represents the implemented CourseCompass PostgreSQL schema.

![CourseCompass Final Database ERD](backend/docs/database/coursecompass-final-erd.svg)

The final ERD is based on the implemented database rather than only the original design.

Earlier editable ERD versions are retained to show the evolution of the database design:

```text
backend/docs/database/erd-v0.1.drawio
backend/docs/database/erd-v0.2.drawio
```

---

# Database Models

The current Prisma schema contains nine main business models.

| Model | Purpose |
|---|---|
| `User` | Stores user accounts, profile information, roles, interests, goals, and planning preferences |
| `Course` | Stores course information, availability metadata, assessment data, and AI embeddings |
| `Review` | Stores course ratings, comments, assessment style, and moderation state |
| `ReviewReport` | Stores reports submitted against reviews |
| `SavedCourse` | Connects users with saved courses |
| `CompletedCourse` | Records courses completed by users |
| `SemesterPlan` | Stores named semester plans |
| `PlanCourse` | Connects courses with semester plans |
| `Notification` | Stores persistent in-app notifications and read state |

Prisma also materialises the prerequisite self-relation as the PostgreSQL table:

```text
_CoursePrerequisites
```

PostgreSQL also contains:

```text
_prisma_migrations
```

This table is maintained by Prisma and stores migration metadata. It is not part of the CourseCompass business domain.

---

# Database Relationships

Important relationships include:

```text
User
 ├── Review
 ├── ReviewReport
 ├── SavedCourse
 ├── CompletedCourse
 ├── SemesterPlan
 └── Notification
```

```text
Course
 ├── Review
 ├── SavedCourse
 ├── CompletedCourse
 ├── PlanCourse
 └── Course prerequisites
```

Semester planning uses:

```text
SemesterPlan
      │
      ▼
 PlanCourse
      │
      ▼
   Course
```

Course prerequisites use a self-referencing many-to-many relationship:

```text
Course
  │
  ▼
_CoursePrerequisites
  │
  ▼
Course
```

---

# Database Enumerations

## UserRole

```text
STUDENT
MODERATOR
ADMIN
```

New public registrations receive:

```text
STUDENT
```

by default.

## ReviewStatus

```text
PENDING
APPROVED
REJECTED
HIDDEN
```

New reviews receive:

```text
PENDING
```

by default.

## ReportStatus

```text
PENDING
RESOLVED
DISMISSED
```

New review reports receive:

```text
PENDING
```

by default.

## CourseSemester

```text
SEMESTER_1
SEMESTER_2
SUMMER
```

## AssessmentType

```text
EXAM
ASSIGNMENT
QUIZ
PROJECT
LAB
PRESENTATION
```

## AssessmentStyle

```text
EXAM_HEAVY
COURSEWORK_HEAVY
PROJECT_BASED
PRACTICAL
BALANCED
```

---

# Core Database Constraints

CourseCompass uses database-level constraints in addition to application validation.

| Area | Constraint |
|---|---|
| User | Email must be unique |
| User | Study year must be between 1 and 8 when provided |
| Course | Course code must be unique |
| Course | Credits must be greater than zero |
| Course | Workload hours must be non-negative when provided |
| Course | Course level must be a valid hundred-level value when provided |
| Review | Ratings must be between 1 and 5 |
| Review | A user may review the same course only once |
| ReviewReport | A user may report the same review only once |
| SavedCourse | A user may save the same course only once |
| CompletedCourse | A user-course completion record is unique |
| SemesterPlan | Year must be between 2000 and 2100 |
| SemesterPlan | Duplicate plan names are not allowed for the same user, year, and semester |
| PlanCourse | A course may appear only once in the same semester plan |
| Prerequisites | Course prerequisite relationships are unique pairs |

Some PostgreSQL `CHECK` constraints are implemented directly in migration SQL because they cannot be completely represented using Prisma schema syntax alone.

---

# Relationship Deletion Behaviour

Relationship deletion behaviour depends on the data type and business requirement.

Examples include:

- Deleting a user removes related saved-course records.
- Deleting a user removes related completed-course records.
- Deleting a user removes the user's semester plans.
- Deleting a user removes associated notifications.
- Deleting a user removes review reports submitted by that user.
- Deleting a semester plan removes its related `PlanCourse` rows.
- Deleting a review removes its related `ReviewReport` rows.
- Removing a saved-course relationship does not delete the related course.
- Completed-course references restrict deletion of referenced courses.
- Courses should normally be deactivated using `isActive` rather than permanently deleted.

---

# Database Setup

Run the following commands from:

```text
backend/
```

Generate Prisma Client:

```powershell
npx prisma generate
```

Apply existing migrations:

```powershell
npx prisma migrate deploy
```

Insert development seed data:

```powershell
npm run db:seed
```

Generate missing course embeddings:

```powershell
npm run embeddings:generate
```

A complete setup is:

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run embeddings:generate
```

---

# Check Database Status

Run:

```powershell
cd backend
npx prisma migrate status
```

A correctly configured database should report that the schema is up to date.

You can also validate the Prisma schema with:

```powershell
npx prisma validate
```

---

# Database Migration Workflow

Database changes should be managed through Prisma migrations rather than manual changes to the shared database.

## 1. Modify the Prisma Schema

Edit:

```text
backend/prisma/schema.prisma
```

## 2. Format the Schema

```powershell
cd backend
npx prisma format
```

## 3. Validate the Schema

```powershell
npx prisma validate
```

## 4. Create a Migration

On a development database:

```powershell
npx prisma migrate dev --create-only --name descriptive_migration_name
```

Example:

```powershell
npx prisma migrate dev --create-only --name add_course_feature
```

## 5. Review the SQL

Review:

```text
backend/prisma/migrations/<timestamp>_<migration_name>/migration.sql
```

before applying the migration.

## 6. Apply the Migration

```powershell
npx prisma migrate dev
```

## 7. Regenerate Prisma Client

```powershell
npx prisma generate
```

## 8. Deploy Shared Migrations

For the shared or cloud database:

```powershell
npx prisma migrate deploy
```

## Migration Rules

Do not:

- Modify a migration that has already been applied and shared.
- Replace shared migrations with manual database changes.
- Use `prisma db push` as a substitute for shared migration history.
- Run `prisma migrate reset` against a shared database unless the team intentionally accepts complete data loss.

---

# Migration History

The current project contains the following migrations:

```text
20260724022214_init
20260730101807_add_data_constraints
20260804050118_init_schema_with_reset_fields
20260806000922_add_prerequisites
20260806120000_sync_embedding
20260815225542_extend_user_course_review_data
20260902100000_add_review_reports
20260905120000_migrate_embedding_to_bge_m3
20260911120000_add_notifications
```

These migrations represent the evolution of the CourseCompass database from its initial schema to the final implemented version.

They include:

- Initial user, course, review, and planning models
- Data validation constraints
- Password-reset fields
- Course prerequisites
- AI embedding storage
- Expanded user profile information
- Expanded course information
- Expanded review information
- Completed courses
- Review reporting
- BGE-M3 embedding migration
- 1024-dimensional vectors
- Persistent notifications

---

# Seed Data

Seed the development database using:

```powershell
cd backend
npm run db:seed
```

Development accounts include:

| Role | Email | Password |
|---|---|---|
| Student | `student@coursecompass.test` | `CourseCompass123!` |
| Moderator | `moderator@coursecompass.test` | `CourseCompass123!` |
| Administrator | `admin@coursecompass.test` | `CourseCompass123!` |

These credentials are intended only for development and testing.

They must not be used as production credentials.

---

# AI Embeddings

CourseCompass uses SiliconFlow:

```text
BAAI/bge-m3
```

to generate course embeddings.

Embeddings are stored in:

```text
Course.embedding
```

using PostgreSQL `pgvector`.

The stored type is:

```text
vector(1024)
```

---

# Embedding Content

The canonical course text used to generate embeddings includes:

- Course code
- Course name
- Description
- Level
- Credits
- Offered semesters
- Assessment types
- Workload hours

Using the same course representation during course creation, updates, batch generation, and retrieval helps maintain consistent semantic-search behaviour.

---

# Generate Missing Embeddings

Run:

```powershell
cd backend
npm run embeddings:generate
```

This generates embeddings for courses that do not currently have one.

---

# Rebuild All Embeddings

If the embedding model or embedding text format changes, regenerate all vectors:

```powershell
cd backend
npm run embeddings:generate -- --force
```

The batch process continues processing remaining courses if an individual embedding request fails and reports final success and failure counts.

---

# Semantic Search

Semantic search follows this process:

```text
User Query
   │
   ▼
Embedding Model
   │
   ▼
Query Vector
   │
   ▼
PostgreSQL + pgvector
   │
   ▼
Cosine Similarity
   │
   ▼
Relevant Courses
```

The default similarity threshold is:

```text
0.35
```

Only active courses are returned.

The semantic-search result limit supports values from:

```text
1–10
```

---

# Semantic Search Filters

Semantic retrieval supports structured filters.

Available filters include:

```text
semester
assessmentType
minCredits
maxCredits
level
```

Semester values include:

```text
SEMESTER_1
SEMESTER_2
SUMMER
```

Structured filters are applied in PostgreSQL before candidate courses are passed to the language model.

---

# AI Recommendations

The AI recommendation feature uses the same semantic retrieval layer as semantic search.

Relevant courses are retrieved first, after which the language model generates user-facing recommendation explanations.

This separates:

```text
Retrieval
```

from:

```text
Natural-language explanation
```

and improves consistency between search and recommendation behaviour.

---

# AI Review Summaries

CourseCompass can generate AI summaries of approved course reviews.

The summarisation process can use:

- Written comments
- Overall ratings
- Difficulty ratings
- Workload ratings
- Teaching ratings
- Usefulness ratings
- Assessment-style counts

Only approved review information should be used for public-facing summaries.

---

# Run Locally

Two terminals are recommended.

## Terminal 1 — Backend

```powershell
cd backend
npm run dev
```

Default backend address:

```text
http://localhost:3000
```

API base:

```text
http://localhost:3000/api
```

## Terminal 2 — Frontend

```powershell
cd frontend
npm run dev
```

Default frontend address:

```text
http://localhost:5173
```

---

# Useful Commands

## Frontend

```powershell
cd frontend

npm run dev
npm run build
npm run preview
```

## Backend

```powershell
cd backend

npm run dev
npm start
npm test

npm run test:smtp
npm run test:backend-rules
npm run test:notifications

npm run db:permission-check
npm run db:status
npm run db:seed

npm run embeddings:generate
npm run embeddings:generate -- --force
```

## Prisma

```powershell
cd backend

npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npx prisma studio
```

---

# API Overview

Main backend routes include the following.

## Health

```text
GET /api/health
GET /api/health/database
```

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

## Users

```text
GET   /api/users/me
PATCH /api/users/me
```

Authentication is required.

## Notifications

```text
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
DELETE /api/notifications
```

The notification list supports options such as:

```text
page
limit
unreadOnly
```

Authentication is required.

## Courses

```text
GET   /api/courses
POST  /api/courses
PATCH /api/courses/:id
```

Course creation and modification require administrator permissions.

## AI

```text
POST /api/ai/test-embedding
POST /api/ai/semantic-search
POST /api/ai/recommend
GET  /api/ai/courses/:id/summary
```

AI endpoints use authentication and role restrictions depending on the endpoint.

AI routes are rate-limited.

The current implementation uses an in-memory limiter. A shared limiter such as Redis or an API gateway would be more appropriate for a multi-instance production deployment.

---

# Password Requirements

New account passwords and password-reset passwords must contain at least:

- 8 characters
- One uppercase letter
- One lowercase letter
- One number
- One special character

Existing stored passwords are not revalidated against newer password rules during normal login.

---

# Verification

## Frontend Build

Verify the production frontend build with:

```powershell
cd frontend
npm run build
```

## Backend Tests

Backend smoke tests require a valid database connection:

```powershell
cd backend
npm test
```

## Notification Tests

```powershell
cd backend
npm run db:permission-check
npm run test:notifications
```

The notification smoke test creates temporary records for an existing user, verifies listing and read-state transitions, and removes the temporary records afterwards.

It tests in-app notifications only.

It does not send browser push notifications or notification emails.

---

# Database Documentation

The main database guide is included in this root README.

Additional database design documentation remains under:

```text
backend/docs/database/
```

## Database Requirements

```text
backend/docs/database/database-requirements.md
```

Contains database requirements and acceptance rules.

## Design Decisions

```text
backend/docs/database/decisions.md
```

Documents important database design decisions and their rationale.

## Service Contracts

```text
backend/docs/database/service-contracts.md
```

Describes service-layer responsibilities and database-access boundaries.

## ERD Design History

```text
backend/docs/database/erd-v0.1.drawio
backend/docs/database/erd-v0.2.drawio
```

These files preserve earlier editable database designs and show the evolution of the schema.

## Final ERD

```text
backend/docs/database/coursecompass-final-erd.svg
```

This represents the final implemented PostgreSQL database structure.

---

# Database Design Evolution

The database evolved throughout development rather than remaining identical to the initial design.

Later additions included:

- Password reset support
- Course prerequisites
- Completed courses
- Expanded user preferences
- Additional course metadata
- Additional review ratings
- Review reporting
- Semantic-search embeddings
- BGE-M3 embeddings
- 1024-dimensional vectors
- Persistent notifications

Keeping the earlier ERD versions alongside the final ERD provides evidence of database design evolution during the project.

---

# Notes

- Do not commit real `.env` files.
- Do not commit API keys or database passwords.
- `SILICONFLOW_API_KEY` is required for embeddings.
- `ZHIPU_API_KEY` is required for AI chat features.
- Valid SMTP configuration is required for password-reset email.
- Schema changes should be reproducible through committed Prisma migrations.
- `_prisma_migrations` is maintained by Prisma and is not a CourseCompass business table.
- `_CoursePrerequisites` is the PostgreSQL join table used for the Prisma course prerequisite self-relation.