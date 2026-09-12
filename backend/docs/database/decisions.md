# CourseCompass Database Decisions

## 1. Course Field Naming

The `Course` model uses:

```text
name
```

instead of:

```text
title
```

because the backend and frontend application contracts use the `name` field for course names.

All application layers should use the same field name to avoid unnecessary mapping.

---

## 2. Shared Cloud PostgreSQL Database

The project initially supported local PostgreSQL development.

For final team integration, CourseCompass uses a shared cloud-hosted PostgreSQL database.

The backend does not contain a hard-coded database host.

The active database is selected through:

```env
DATABASE_URL
```

This means local and cloud environments use the same:

- Prisma schema
- migrations
- application services

Only the connection configuration changes.

Real database credentials are not committed to Git.

---

## 3. Shared Prisma Client

The backend uses one shared Prisma client located at:

```text
src/lib/prisma.js
```

Service modules import the shared instance.

This avoids:

- creating a new database client per request
- unnecessary connection pools
- inconsistent database configuration

Controllers and routes should not create their own Prisma clients.

---

## 4. Prisma Migration Strategy

Database schema evolution is tracked through Prisma migrations.

Schema changes are committed under:

```text
prisma/migrations/
```

Development changes may be created with:

```powershell
npx prisma migrate dev
```

Existing migrations are deployed to the shared database using:

```powershell
npx prisma migrate deploy
```

Already-applied shared migrations must not be edited.

`prisma db push` is not used as a replacement for shared migration history.

`prisma migrate reset` must not be run against the shared database unless destructive reset has been explicitly agreed by the team.

---

## 5. Review Uniqueness

A user may submit only one review for each course.

The database enforces this through:

```text
UNIQUE(userId, courseId)
```

A user may edit the existing review instead of creating duplicate reviews.

---

## 6. Review Moderation

New reviews begin with:

```text
PENDING
```

Moderation may move a review to:

```text
APPROVED
REJECTED
HIDDEN
```

Only approved reviews are used by normal public review views.

Student edits return a review to the moderation workflow.

---

## 7. Review Reports

Review reports are stored separately from reviews.

A report records:

- the target review
- reporter
- reason
- moderation state

A user may report the same review only once.

Report states are:

```text
PENDING
RESOLVED
DISMISSED
```

Deleting a review cascades to its review reports so reports cannot reference a deleted review.

---

## 8. Saved Courses

Saved courses use a join model:

```text
SavedCourse
```

with composite key:

```text
(userId, courseId)
```

This prevents duplicate saves without requiring a separate surrogate identifier.

Removing a saved relationship does not remove the course itself.

---

## 9. Completed Courses

Completed courses are represented by:

```text
CompletedCourse
```

with composite key:

```text
(userId, courseId)
```

The model also stores:

```text
completedAt
```

when available.

An upsert-based service operation allows the completion date to be corrected without creating duplicate records.

---

## 10. Semester Planning

Semester plans belong to users.

Course membership inside plans is represented by:

```text
PlanCourse
```

with composite key:

```text
(planId, courseId)
```

This prevents one course from appearing twice inside the same plan.

Plan names are unique within the combination:

```text
user + year + semester
```

Deleting a semester plan cascades to its `PlanCourse` records.

---

## 11. Course Deletion

Courses should normally be deactivated using:

```text
isActive = false
```

instead of being permanently deleted.

This preserves historical relationships and reduces the risk of removing data referenced by:

- reviews
- completed courses
- plans
- prerequisites

Normal course queries exclude inactive courses where appropriate.

---

## 12. Course Prerequisites

Course prerequisites are represented as a self-referencing many-to-many relationship on `Course`.

This was chosen because:

- one course may require multiple earlier courses
- one course may unlock multiple later courses

The relationship supports both:

```text
prerequisites
```

and:

```text
prerequisiteFor
```

views.

The application prevents a course from becoming its own prerequisite.

---

## 13. Semantic Embeddings in PostgreSQL

Course embeddings are stored directly in PostgreSQL using pgvector.

The current representation is:

```text
vector(1024)
```

The embedding model is:

```text
BAAI/bge-m3
```

The database stores embeddings alongside course records because semantic retrieval is performed directly against PostgreSQL.

This avoids maintaining a separate vector database for the current project scope.

---

## 14. Canonical Course Embedding Text

All course vectors are generated from one shared text representation.

The embedding text includes:

- course code
- course name
- description
- level
- credits
- offered semesters
- assessment types
- workload hours

Using one canonical representation keeps:

- batch-generated vectors
- newly created course vectors
- updated course vectors

consistent.

---

## 15. Semantic Search

Semantic search generates an embedding for the user's query and compares it against stored course vectors.

The current default similarity threshold is:

```text
0.35
```

Only active courses with non-null embeddings are considered.

Structured filters may also be applied for:

- semester
- assessment type
- credits
- level

---

## 16. Persistent Notifications

Notifications are stored in PostgreSQL rather than only in browser memory.

This allows:

- read/unread state to persist
- users to access notifications after logging in again
- notification history to be queried and paginated

Each notification contains:

- type
- title
- message
- optional read timestamp
- creation timestamp

Notification creation is treated as secondary to the main operation.

If notification persistence fails, the primary operation such as saving a course or updating a course should not automatically fail because of the notification error.

---

## 17. Notification Retention

The notification service supports deleting old notifications.

This prevents the notification table from growing without limit during long-term use.

The current backend provides a cleanup operation for notifications older than a configured number of days.

---

## 18. Service-Layer Database Access

Database operations are normally placed inside Service modules.

Examples include:

```text
userService
courseService
savedCourseService
completedCourseService
planService
reviewService
notificationService
courseEmbeddingService
courseRetrievalService
```

This keeps:

- database queries
- business rules
- controller logic

separated.

---

## 19. Security of Database Credentials

Real values for:

```text
DATABASE_URL
JWT_SECRET
API keys
SMTP credentials
```

must not be committed to Git.

Documentation and `.env.example` files must contain placeholders only.

---

## 20. Final Database Scope

The final implemented database scope includes:

- authentication-related user data
- extended student profiles
- courses
- course prerequisites
- semantic embeddings
- reviews
- review moderation
- review reports
- saved courses
- completed courses
- semester planning
- persistent notifications
- cloud-hosted PostgreSQL integration

Future database changes should extend the existing migration history instead of rewriting the final shared schema history.