# CourseCompass Database Service Contracts

## 1. Purpose

This document describes the main database-facing Service modules used by the CourseCompass backend.

The intended backend structure is:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Shared Prisma Client
  ↓
PostgreSQL
```

Controllers should normally call Service functions instead of directly implementing database queries.

---

## 2. Shared Prisma Client

The shared Prisma client is defined in:

```text
src/lib/prisma.js
```

Service files import:

```javascript
const prisma = require('../lib/prisma');
```

The shared Prisma instance is configured using:

```env
DATABASE_URL
```

and uses the PostgreSQL adapter.

Rules:

- Do not create `new PrismaClient()` inside each controller.
- Do not create a new Prisma connection for each request.
- Do not access PostgreSQL directly from frontend code.
- Route files should not contain business-level database queries.
- Database credentials must not be exposed in responses or logs.

---

## 3. Current Database-Related Services

The main database-related Service modules are:

```text
src/services/userService.js
src/services/courseService.js
src/services/savedCourseService.js
src/services/completedCourseService.js
src/services/planService.js
src/services/reviewService.js
src/services/notificationService.js
src/services/courseEmbeddingService.js
src/services/courseRetrievalService.js
```

Other backend services such as AI-provider and email services may support these modules but are not themselves the main relational persistence layer.

---

# 4. User Service

File:

```text
src/services/userService.js
```

Responsibilities include:

- email normalisation
- authentication user lookup
- safe public user lookup
- account creation
- password hashing
- reset-code creation
- password reset
- profile updates

---

## 4.1 `normalizeEmail(email)`

Normalises an email by:

- trimming whitespace
- converting it to lowercase

Invalid or empty input throws a `TypeError`.

Example:

```javascript
const email = userService.normalizeEmail(
    '  STUDENT@CourseCompass.Test  '
);
```

Result:

```text
student@coursecompass.test
```

---

## 4.2 `findUserForAuthenticationByEmail(email)`

Finds a user by normalised email.

The authentication projection includes the password hash because password verification requires it.

Password hashes returned by this Service must never be sent to the frontend.

---

## 4.3 `findPublicUserById(id)`

Returns the safe public/profile representation of a user.

The result includes profile information such as:

- id
- email
- name
- role
- major
- study year
- interests
- goals
- planning preferences
- completed-course details
- timestamps

It does not expose the password hash.

---

## 4.4 `createUser(data)`

Creates a standard user account.

The Service:

1. validates password policy
2. normalises the email
3. validates profile inputs
4. hashes the plaintext password with bcrypt
5. stores the new account
6. returns a safe user projection

Public registration relies on the database default:

```text
STUDENT
```

for the user role.

---

## 4.5 `generateResetCode(email)`

Generates a six-digit password-reset verification code.

The code and its expiration time are stored on the user record.

If the email does not belong to a user, the Service returns no reset code.

---

## 4.6 `resetPassword(email, resetCode, newPassword)`

Resets a user's password after verifying:

- email
- reset code
- code expiration
- password policy

On success the Service:

- hashes the new password
- updates `passwordHash`
- clears `resetCode`
- clears `resetCodeExpires`

---

## 4.7 `updateUserProfile(id, data)`

Updates supported profile fields.

Current editable profile data includes:

- name
- major
- study year
- interests
- goals
- planning preferences

Input validation is applied before persistence.

---

# 5. Course Service

File:

```text
src/services/courseService.js
```

Responsibilities include:

- active course listing
- administrator course listing
- course creation
- course updates
- course detail loading
- prerequisite relationships
- course comparison
- keyword/fuzzy search
- rating-summary integration
- course embedding refresh
- notifications following course updates

---

## 5.1 Course Listing

Normal student-facing course queries return active courses.

Typical course data includes:

- id
- code
- name
- description
- credits
- workload hours
- level
- offered semesters
- assessment types
- official link
- prerequisites
- timestamps

Administrator queries may include inactive courses.

---

## 5.2 Course Creation

Course creation may include prerequisite references.

Prerequisites may be resolved by supported course references.

The Service validates that prerequisite courses exist before creating the relationship.

After course creation, embedding generation may be scheduled.

---

## 5.3 Course Updates

Course updates may modify:

- name
- code
- credits
- description
- workload
- offered semesters
- level
- assessment types
- official link
- active state
- prerequisites

When relevant course content changes, the Service refreshes the semantic embedding.

Users who saved an updated course may receive an in-app notification.

---

## 5.4 Course Prerequisites

Course detail queries may include both:

```text
prerequisites
```

and:

```text
prerequisiteFor
```

relationships.

A course must not be configured as its own prerequisite.

---

## 5.5 Course Comparison

The Course Service provides database context for comparison features.

Comparison data may include:

- course attributes
- prerequisite context
- approved review ratings
- selected review comments

Only active courses should be used for normal student comparison.

---

## 5.6 Course Search

Course search supports:

- text search
- fuzzy search
- structured filters

Structured filters may include:

- course level
- semester
- assessment type
- credit range
- rating
- prerequisite presence

---

# 6. Saved Course Service

File:

```text
src/services/savedCourseService.js
```

Exports:

```text
addSavedCourse
getMySavedCourses
removeSavedCourse
```

---

## 6.1 `addSavedCourse(userId, courseId)`

Creates a `SavedCourse` relationship.

The database composite key prevents duplicate saves.

A notification is created after a course is successfully saved.

---

## 6.2 `getMySavedCourses(userId)`

Returns a user's saved courses.

Returned course data includes information needed for saved-course and planning views.

---

## 6.3 `removeSavedCourse(userId, courseId)`

Deletes the user-course saved relationship.

The course itself is not deleted.

A notification may be created after successful removal.

---

# 7. Completed Course Service

File:

```text
src/services/completedCourseService.js
```

Exports:

```text
markCourseCompleted
unmarkCourseCompleted
getCompletedCoursesByUser
```

---

## 7.1 `markCourseCompleted(userId, courseId, completedAt)`

Marks a course as completed.

The operation uses an upsert.

This makes repeated completion requests idempotent and allows the completion date to be corrected.

---

## 7.2 `unmarkCourseCompleted(userId, courseId)`

Removes a completed-course relationship.

If the record is already absent, the Service returns a false result rather than requiring a database exception.

---

## 7.3 `getCompletedCoursesByUser(userId)`

Returns all completed courses for a user.

Results include:

- user id
- course id
- completion date
- basic course information

Courses are ordered by course code.

---

# 8. Semester Plan Service

File:

```text
src/services/planService.js
```

Exports:

```text
createPlan
getUserPlans
addCourseToPlan
removeCourseFromPlan
deletePlan
```

---

## 8.1 `createPlan(userId, data)`

Creates a semester plan owned by one user.

The stored plan includes:

- name
- year
- semester
- owner

A notification is created after successful plan creation.

---

## 8.2 `getUserPlans(userId)`

Returns all plans belonging to a user.

Each plan includes its `PlanCourse` relationships and related course details.

---

## 8.3 Plan Ownership

Plan modification operations must verify that the current user owns the plan.

Attempting to modify another user's plan should result in an authorization error.

---

## 8.4 `addCourseToPlan(userId, planId, courseId)`

Adds a course to a semester plan.

Before persistence, the Service loads prerequisite information.

If prerequisites are neither:

- completed
- nor already planned

the Service may return a non-blocking warning.

The requested course may still be added.

A notification is created after successful addition.

---

## 8.5 `removeCourseFromPlan(userId, planId, courseId)`

Removes one course from a user's semester plan.

Ownership is checked before deletion.

A notification is created after successful removal.

---

## 8.6 `deletePlan(userId, planId)`

Deletes a semester plan owned by the user.

Related `PlanCourse` records are removed through the database relationship rules.

---

# 9. Review Service

File:

```text
src/services/reviewService.js
```

Exports:

```text
createReview
updateReview
getApprovedReviewsByCourse
getUserReviewForCourse
getPendingReviews
updateReviewStatus
reportReview
getPendingReports
updateReportStatus
getCourseRatingSummary
```

---

## 9.1 Rating Validation

Required ratings must be integers from:

```text
1
```

to:

```text
5
```

Optional rating fields use the same range when supplied.

Supported assessment styles are:

```text
EXAM_HEAVY
COURSEWORK_HEAVY
PROJECT_BASED
PRACTICAL
BALANCED
```

---

## 9.2 `createReview(data)`

Creates a review for an active course.

New reviews receive:

```text
PENDING
```

status.

The database prevents the same user from creating more than one review for the same course.

---

## 9.3 `updateReview(userId, courseId, data)`

Updates a user's existing review.

Student edits return the review to:

```text
PENDING
```

so moderation can occur again.

---

## 9.4 `getApprovedReviewsByCourse(courseId)`

Returns only reviews whose status is:

```text
APPROVED
```

This is the appropriate query for normal public course pages.

---

## 9.5 `getUserReviewForCourse(userId, courseId)`

Returns the review created by a specific user for a course, if one exists.

---

## 9.6 `getPendingReviews()`

Returns reviews waiting for moderation.

---

## 9.7 `updateReviewStatus(reviewId, newStatus)`

Updates review moderation status.

Supported values are:

```text
PENDING
APPROVED
REJECTED
HIDDEN
```

The review author receives a moderation notification after an update.

---

## 9.8 `reportReview(reviewId, reporterId, reason)`

Creates a review report.

Rules include:

- the review must exist
- the reporter must be valid
- a reason is required
- a user cannot report their own review
- duplicate reports by the same user are prevented by the database

Notifications may be created for:

- the reporter
- moderators
- administrators

---

## 9.9 `getPendingReports()`

Returns reports with:

```text
PENDING
```

status for moderation.

---

## 9.10 `updateReportStatus(reportId, newStatus)`

Supported moderation outcomes are:

```text
RESOLVED
DISMISSED
```

The reporter receives a status notification.

---

## 9.11 `getCourseRatingSummary(courseId)`

Calculates an aggregate summary from approved reviews.

The summary may contain:

- review count
- average overall rating
- average difficulty rating
- average workload rating
- average teaching rating
- average usefulness rating

---

# 10. Notification Service

File:

```text
src/services/notificationService.js
```

Exports:

```text
createNotifications
createNotificationsSafely
listForUser
markRead
markAllRead
deleteOne
deleteAll
deleteExpired
```

---

## 10.1 `createNotifications(userIds, data)`

Creates one notification for each unique valid user id.

Notification content includes:

- type
- title
- message

---

## 10.2 `createNotificationsSafely(userIds, data)`

Attempts notification creation without allowing notification failure to automatically fail the primary business operation.

Failures are logged for diagnosis.

---

## 10.3 `listForUser(userId, options)`

Returns paginated notifications.

Supported options include:

```text
unreadOnly
page
limit
```

The result includes:

- notification items
- total count
- unread count
- current page
- page limit

---

## 10.4 `markRead(userId, notificationId)`

Sets:

```text
readAt
```

for one notification owned by the user.

---

## 10.5 `markAllRead(userId)`

Marks all unread notifications belonging to the user as read.

---

## 10.6 Notification Deletion

The Service supports:

```text
deleteOne
deleteAll
```

for user-owned notifications.

---

## 10.7 `deleteExpired(days)`

Deletes notifications older than the retention period.

The current default retention value is:

```text
180 days
```

---

# 11. Course Embedding Service

File:

```text
src/services/courseEmbeddingService.js
```

Exports:

```text
buildCourseEmbeddingText
refreshCourseEmbedding
runCourseEmbeddingJob
enqueueCourseEmbedding
```

---

## 11.1 `buildCourseEmbeddingText(course)`

Builds the canonical semantic representation of a course.

The text includes:

- code
- name
- description
- level
- credits
- offered semesters
- assessment types
- workload hours

Every course vector should use the same representation.

---

## 11.2 `refreshCourseEmbedding(course)`

Generates a new embedding and stores it in PostgreSQL.

The embedding is persisted in the `Course.embedding` vector field.

---

## 11.3 `runCourseEmbeddingJob(course)`

Runs one embedding job.

Provider failures are handled so batch or asynchronous processing can continue.

---

## 11.4 `enqueueCourseEmbedding(course)`

Schedules course embedding generation without blocking the primary course-creation request.

---

# 12. Course Retrieval Service

File:

```text
src/services/courseRetrievalService.js
```

Exports:

```text
semanticSearchCourses
```

---

## 12.1 `semanticSearchCourses(options)`

Semantic search:

1. generates an embedding for the query
2. converts it to PostgreSQL vector format
3. applies structured database filters
4. compares it with stored course vectors
5. excludes inactive courses
6. excludes courses without embeddings
7. applies a similarity threshold
8. sorts by vector distance
9. limits the result count

Supported options include:

```text
query
limit
threshold
semester
assessmentType
minCredits
maxCredits
level
```

The default threshold comes from:

```env
AI_SIMILARITY_THRESHOLD
```

and falls back to:

```text
0.35
```

---

# 13. Prisma Error Handling

Controllers should convert Service/database errors into safe HTTP responses.

Typical mappings include:

| Error | Meaning | Suggested Response |
|---|---|---|
| `TypeError` | Invalid input | `400 Bad Request` |
| `P2002` | Unique constraint violation | `409 Conflict` |
| `P2003` | Foreign-key constraint violation | `409 Conflict` |
| database constraint rejection | Invalid persisted value | `400 Bad Request` |
| `P2025` | Record not found | `404 Not Found` |
| database unavailable | Persistence failure | `500 Internal Server Error` |

Application-specific Services may also attach:

```text
statusCode
```

to domain errors.

Controllers should preserve safe application messages without exposing internal database details.

---

# 14. Security Rules

Never return the following to frontend clients:

- password hashes
- password reset