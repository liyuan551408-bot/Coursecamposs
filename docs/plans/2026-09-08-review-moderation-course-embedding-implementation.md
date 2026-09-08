# Review Moderation and Course Embedding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a moderator review queue and non-blocking, database-persisted course embedding generation.

**Architecture:** Reuse the existing protected moderation API and review statuses, adding only the missing frontend queue. Wrap the existing embedding persistence function in a small in-process scheduler and enqueue one job after each successful course insert.

**Tech Stack:** Express 5, Prisma, PostgreSQL/pgvector, Vue 3, Vue Router, Element Plus, Node.js built-in test runner.

---

### Task 1: Schedule course embeddings

**Files:**
- Modify: `backend/src/services/courseEmbeddingService.js`
- Modify: `backend/src/services/courseService.js`
- Create: `backend/test/courseEmbeddingJob.test.js`
- Modify: `backend/package.json`

1. Add a scheduler that runs one embedding refresh with `setImmediate` and catches failures.
2. Inject scheduler/worker dependencies so the behavior is testable without calling an external provider.
3. Replace the awaited refresh after `prisma.course.create` with one enqueue call.
4. Assert that enqueueing is non-blocking, invokes the worker once, and contains failures.

### Task 2: Build the moderation queue

**Files:**
- Modify: `frontend/src/api/reviews.js`
- Create: `frontend/src/views/ModerationDashboard.vue`
- Modify: `frontend/src/router/index.js`
- Modify: `frontend/src/App.vue`
- Modify: `frontend/src/views/AdminDashboard.vue`

1. Add the pending-review API wrapper.
2. Render pending reviews with author, course, ratings, comment, submission time, and approve/reject actions.
3. Add loading, empty, failure, refresh, and per-review submitting states.
4. Protect `/moderation` for moderator/admin roles and expose it in role-aware navigation.
5. Replace the admin dashboard's manual review-ID form with a link to the queue.

### Task 3: Verify

**Files:**
- No additional files.

1. Run the focused backend unit test and backend syntax checks.
2. Run the frontend production build.
3. Run `git diff --check` and review the final diff without altering pre-existing user changes.
