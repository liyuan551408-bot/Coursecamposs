# CourseCompass Database Requirements

## 1. Purpose

The CourseCompass database stores persistent application data required for:

- authentication
- user profiles
- course discovery
- course planning
- course comparison
- completed-course tracking
- reviews and moderation
- review reporting
- saved courses
- notifications
- semantic course retrieval

The application uses PostgreSQL through Prisma.

The final integrated project uses a shared cloud-hosted PostgreSQL database configured through the `DATABASE_URL` environment variable.

---

## 2. User Management

The system must store:

- unique user email
- password hash
- display name
- user role
- major
- study year
- interests
- goals
- planning preferences
- account creation time
- account update time

Supported roles are:

```text
STUDENT
MODERATOR
ADMIN
```

New public registrations must receive the default:

```text
STUDENT
```

The database must never store plaintext passwords.

---

## 3. Password Reset

The system must support password-reset verification.

The database stores:

- reset verification code
- reset-code expiration time

A successful password reset must:

- replace the stored password hash
- clear the reset code
- clear the expiration value

Expired reset codes must not be accepted.

---

## 4. Course Information

The database must store the following course information:

- course code
- course name
- description
- credits
- course level
- estimated workload hours
- offered semesters
- assessment types
- official course link
- active/inactive state
- creation time
- update time

Course codes must be unique.

Supported semesters are:

```text
SEMESTER_1
SEMESTER_2
SUMMER
```

Supported assessment types are:

```text
EXAM
ASSIGNMENT
QUIZ
PROJECT
LAB
PRESENTATION
```

Inactive courses should normally remain in the database instead of being permanently deleted.

---

## 5. Course Prerequisites

The database must support course prerequisite relationships.

Requirements:

- a course may have multiple prerequisites
- one course may be a prerequisite for multiple courses
- prerequisite relationships must refer to valid courses
- a course must not be configured as its own prerequisite

The relationship is represented as a self-referencing many-to-many relationship on `Course`.

---

## 6. Saved Courses

A user may save courses for later use.

Requirements:

- a user may save multiple courses
- the same course may be saved by multiple users
- the same user must not save the same course twice
- removing a saved-course relationship must not remove the course itself

The relationship uses a composite key:

```text
(userId, courseId)
```

---

## 7. Completed Courses

A user may record courses that they have completed.

The database stores:

- user
- course
- optional completion date

Requirements:

- one user/course completion pair must be unique
- repeated completion updates may update the completion date
- completed courses may be used by planning and recommendation features

The relationship uses:

```text
(userId, courseId)
```

as its composite key.

---

## 8. Semester Planning

A user may:

- create multiple semester plans
- add courses to a plan
- remove courses from a plan
- delete a plan
- view all courses inside a plan

Each semester plan stores:

- owner
- name
- year
- semester
- creation time

Duplicate plan names must not be allowed for the same:

```text
user + year + semester
```

A course must not appear twice inside the same semester plan.

---

## 9. Reviews

Students may review courses.

A review stores:

- user
- course
- overall rating
- difficulty rating
- workload rating
- optional teaching rating
- optional usefulness rating
- optional assessment style
- optional written comment
- moderation status
- creation time
- update time

A user may review the same course only once.

Required moderation statuses are:

```text
PENDING
APPROVED
REJECTED
HIDDEN
```

New reviews must start as:

```text
PENDING
```

Only approved reviews should be shown through normal public course views.

---

## 10. Review Reports

Users may report reviews.

A report stores:

- review
- reporting user
- reason
- report status
- creation time

Requirements:

- users must not repeatedly report the same review
- a user/report relationship must remain traceable
- moderators and administrators must be able to process pending reports

Supported report statuses are:

```text
PENDING
RESOLVED
DISMISSED
```

New reports must begin as:

```text
PENDING
```

---

## 11. Notifications

The system must store persistent in-app notifications.

A notification stores:

- user
- notification type
- title
- message
- optional read timestamp
- creation timestamp

Requirements:

- notifications must belong to a valid user
- unread notifications have `readAt = null`
- users must be able to mark one notification as read
- users must be able to mark all notifications as read
- users must be able to delete notifications
- deleting a user must remove that user's notifications

Notification persistence must not cause an unrelated primary operation to fail if notification creation encounters an error.

---

## 12. AI Recommendation and Semantic Search Data

The database supports AI-assisted course discovery.

The recommendation and semantic retrieval system may use:

- course code
- course name
- course description
- course level
- credits
- offered semesters
- assessment types
- workload hours
- completed courses
- user profile information
- planning preferences

Each course may store a semantic embedding.

The current embedding representation is:

```text
vector(1024)
```

The current embedding model is:

```text
BAAI/bge-m3
```

Course embeddings are stored in PostgreSQL using pgvector.

Only active courses with a valid embedding should be considered by semantic retrieval.

---

## 13. Semantic Search Filters

Semantic retrieval must support structured filtering where required.

Supported filters include:

- semester
- assessment type
- minimum credits
- maximum credits
- course level

Filtering should occur before returning the final result set.

---

## 14. Data Integrity Requirements

The database must enforce important integrity rules at the database level where practical.

Examples include:

- unique user email
- unique course code
- valid course credit values
- valid workload values
- valid rating ranges
- unique user-course review
- unique user-review report
- unique saved course relationship
- unique completed course relationship
- unique plan/course relationship
- unique plan name within the same user/year/semester scope

Application validation supplements database constraints but does not replace them.

---

## 15. Deletion Requirements

Deletion rules must protect relational consistency.

Required behaviour includes:

- deleting a saved relationship must not delete the course
- deleting a semester plan must delete its `PlanCourse` records
- deleting a review must delete related review reports
- deleting a user must clean up user-owned saved-course records
- deleting a user must clean up completed-course records
- deleting a user must clean up semester plans
- deleting a user must clean up review reports
- deleting a user must clean up notifications
- courses should normally be deactivated instead of permanently deleted
- course deletion must respect relationships that restrict deletion

---

## 16. Database Access Requirements

Backend database access should use:

```text
src/lib/prisma.js
```

as the shared Prisma client.

Database queries should normally be implemented inside Service modules rather than directly inside:

- route files
- frontend code

Controllers should call Service functions for database-backed operations.

The frontend must never connect directly to PostgreSQL.

---

## 17. Cloud Database Requirements

The final integrated application uses a shared cloud-hosted PostgreSQL database.

Requirements:

- the connection string must be supplied through `DATABASE_URL`
- real credentials must not be stored in Git
- all developers must use compatible Prisma migrations
- schema changes must be represented by committed migrations
- existing migrations must be deployed with `prisma migrate deploy`
- destructive reset commands must not be run against the shared database without team approval

Changing from a local database to a cloud database must not require different application data models.

---

## 18. Migration Requirements

Database schema changes must use Prisma migrations.

The team must:

1. edit `prisma/schema.prisma`
2. validate and format the schema
3. generate a migration
4. inspect generated SQL
5. test the migration
6. commit the migration
7. deploy the migration to the shared database
8. verify migration status

Already-applied shared migrations must not be rewritten.

---

## 19. Security Requirements

The database layer must not expose:

- plaintext passwords
- password hashes in normal API responses
- database connection strings
- API keys
- SMTP credentials
- raw SQL errors
- internal stack traces
- internal filesystem paths

Secrets must remain in environment variables.

---

## 20. Verification Requirements

Before database-related changes are considered ready for integration, the following should succeed where applicable:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate status
npm test
```

Database permission checks may also be run with:

```powershell
npm run db:permission-check
```

Notification persistence may be checked with:

```powershell
npm run test:notifications
```