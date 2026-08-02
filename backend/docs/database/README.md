# CourseCompass Database Guide

## 1. Overview

CourseCompass uses PostgreSQL as its relational database and Prisma ORM as the database access layer.

Current database technologies:

- PostgreSQL
- Prisma ORM 7
- `@prisma/client`
- `@prisma/adapter-pg`
- Node.js
- Express

## 2. Current Database Models

The current Prisma Schema contains six business models:

| Model | Purpose |
|---|---|
| `User` | Stores user accounts, profiles and roles |
| `Course` | Stores course information |
| `Review` | Stores course ratings and comments |
| `SavedCourse` | Connects users with saved courses |
| `SemesterPlan` | Stores a user's semester plans |
| `PlanCourse` | Connects courses with semester plans |

Prisma also creates the `_prisma_migrations` table to record applied migrations.

## 3. Enumerations

### UserRole

Available user roles:

- `STUDENT`
- `MODERATOR`
- `ADMIN`

New public registrations receive the default `STUDENT` role.

### ReviewStatus

Available review states:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `HIDDEN`

New reviews receive the default `PENDING` status.

## 4. Environment Configuration

Create a local `.env` file based on `.env.example`:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/course_compass"
PORT=3000
JWT_SECRET=YOUR_JWT_SECRET
```

Replace `USERNAME` and `PASSWORD` with the local PostgreSQL credentials.

Security requirements:

- Never commit `.env`.
- Never store real passwords in source code.
- Never expose `DATABASE_URL` or `JWT_SECRET` to frontend code.
- Only `.env.example` should be committed.

## 5. Initial Project Setup

Install project dependencies:

```powershell
npm.cmd install
```

Generate Prisma Client:

```powershell
npx.cmd prisma generate
```

Apply all existing migrations:

```powershell
npx.cmd prisma migrate deploy
```

Check migration status:

```powershell
npx.cmd prisma migrate status
```

A correctly configured database should display:

```text
Database schema is up to date!
```

Insert development seed data:

```powershell
npx.cmd prisma db seed
```

## 6. Development Migration Workflow

When the Prisma Schema needs to change, use the following workflow.

### Step 1: Edit the Schema

Edit:

```text
prisma/schema.prisma
```

### Step 2: Format and Validate

```powershell
npx.cmd prisma format
npx.cmd prisma validate
```

### Step 3: Create a Migration Without Applying It

```powershell
npx.cmd prisma migrate dev --create-only --name descriptive_migration_name
```

Use a clear migration name, for example:

```powershell
npx.cmd prisma migrate dev --create-only --name add_course_prerequisites
```

### Step 4: Review the SQL

Open the newly created:

```text
prisma/migrations/<timestamp>_<migration_name>/migration.sql
```

Check that the SQL matches the intended database change.

### Step 5: Apply the Migration

```powershell
npx.cmd prisma migrate dev
```

### Step 6: Regenerate Prisma Client

```powershell
npx.cmd prisma generate
```

### Step 7: Confirm Database Status

```powershell
npx.cmd prisma migrate status
```

Important rules:

- Do not edit a migration that has already been applied or shared.
- Do not manually change production database tables.
- Do not use `prisma db push` as a replacement for shared migrations.
- Do not run `prisma migrate reset` unless the team agrees that local data may be deleted.

## 7. Migration History

The current project contains:

### Initial Migration

```text
20260724022214_init
```

This migration creates:

- Three-role user enum
- Review status enum
- Six business tables
- Primary keys
- Foreign keys
- Unique constraints
- Composite keys
- Initial indexes

### Data Constraints Migration

```text
20260730101807_add_data_constraints
```

This migration adds:

- Unique semester plan names for the same user, year and semester
- Positive course credit validation
- Non-negative course workload validation
- Review rating range validation
- Semester plan year validation

## 8. Seed Data

Run the seed command:

```powershell
npm.cmd run db:seed
```

The seed uses `upsert`, so it may be run more than once without creating duplicate users or courses.

Development accounts:

| Role | Email | Password |
|---|---|---|
| Student | `student@coursecompass.test` | `CourseCompass123!` |
| Moderator | `moderator@coursecompass.test` | `CourseCompass123!` |
| Administrator | `admin@coursecompass.test` | `CourseCompass123!` |

The seed also creates:

- Development courses
- One approved review
- One saved course
- One semester plan
- One course inside the semester plan

These accounts and passwords are for development only. They must not be used in production.

## 9. Database Constraints

The database currently enforces the following rules:

| Area | Constraint |
|---|---|
| User | Email must be unique |
| Course | Course code must be unique |
| Course | Credits must be greater than zero |
| Course | Workload must be null or non-negative |
| Review | A user may review a course only once |
| Review | Ratings must be between 1 and 5 |
| SavedCourse | A user may save a course only once |
| SemesterPlan | Duplicate plan names are not allowed for the same user, year and semester |
| SemesterPlan | Year must be between 2000 and 2100 |
| PlanCourse | A course may appear only once in the same semester plan |

Some PostgreSQL `CHECK` constraints are stored directly in migration SQL because they cannot be fully represented by the current Prisma Schema syntax.

## 10. Relationship Deletion Rules

Current deletion behaviour:

- Deleting a user deletes the user's saved courses.
- Deleting a user deletes the user's semester plans.
- Deleting a semester plan deletes its `PlanCourse` records.
- Deleting a saved user-course relationship does not delete the course.
- Courses should normally be deactivated using `isActive` instead of being permanently deleted.
- A course referenced by a review or plan cannot be deleted unless its relationships are handled first.

## 11. Database Tests

Run all tests:

```powershell
npm.cmd test
```

Run individual tests:

```powershell
npm.cmd run test:user-service
npm.cmd run test:course-service
npm.cmd run test:database
```

The tests verify:

- User email normalisation
- User creation
- Password hash protection
- Duplicate email rejection
- Active course queries
- Course sorting and query limits
- Unique course codes
- Positive course credits
- Non-negative workload values
- Rating values between 1 and 5
- Unique semester plans
- Relationship cascade deletion

The smoke tests use fake records and remove their temporary data after completion.

## 12. Useful Commands

Validate the Schema:

```powershell
npx.cmd prisma validate
```

Format the Schema:

```powershell
npx.cmd prisma format
```

Generate Prisma Client:

```powershell
npx.cmd prisma generate
```

Check migration status:

```powershell
npx.cmd prisma migrate status
```

Run seed data:

```powershell
npx.cmd prisma db seed
```

Open Prisma Studio:

```powershell
npx.cmd prisma studio
```

Start the backend:

```powershell
npm.cmd start
```

Run all tests:

```powershell
npm.cmd test
```

## 13. Current Scope and Future Work

Schema v0.1 currently supports:

- User accounts and roles
- Courses
- Reviews and moderation status
- Saved courses
- Semester plans
- Courses inside semester plans

The following requirements are planned for a future Schema version:

- Course prerequisites
- Course offerings
- Course assessments
- Course tags
- Completed courses
- Review reports
- AI recommendation metadata