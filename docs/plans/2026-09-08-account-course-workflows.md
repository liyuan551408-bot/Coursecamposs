# Account and Course Workflows Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect the existing Vue features to the Express/Prisma APIs and complete search, profile, planning, moderation, administration, and password-reset workflows.

**Architecture:** Keep Express controllers thin and put ownership and validation rules in services. Add focused frontend API modules, then let Pinia own server-backed saved-course and semester-plan state. Pages load account data on mount and only mutate local state after successful API writes.

**Tech Stack:** Vue 3, Pinia, Vue Router, Element Plus, Axios, Express 5, Prisma, PostgreSQL.

---

### Task 1: Complete account-data backend endpoints

**Files:**
- Create: `backend/src/controllers/completedCourseController.js`
- Create: `backend/src/routes/completedCourseRoutes.js`
- Modify: `backend/app.js`
- Modify: `backend/src/routes/planRoutes.js`
- Modify: `backend/src/controllers/planController.js`
- Modify: `backend/src/services/planService.js`

**Steps:**
1. Add authenticated list, upsert, and delete endpoints for completed courses using `completedCourseService`.
2. Add owned plan deletion and owned plan-course deletion endpoints.
3. Verify plan ownership before adding or removing a course.
4. Run `node --check` for every changed backend file.

### Task 2: Add frontend API clients and server-backed stores

**Files:**
- Create: `frontend/src/api/savedCourses.js`
- Create: `frontend/src/api/plans.js`
- Create: `frontend/src/api/users.js`
- Modify: `frontend/src/api/courses.js`
- Modify: `frontend/src/api/ai.js`
- Modify: `frontend/src/stores/saved.js`
- Modify: `frontend/src/stores/planner.js`

**Steps:**
1. Wrap saved-course, plan, profile, completed-course, course-search, course-update, and semantic-search endpoints.
2. Replace localStorage persistence in saved and planner stores with async server synchronization.
3. Normalize nested Prisma plan and saved-course records into course arrays used by Vue pages.
4. Verify with the frontend production build.

### Task 3: Implement keyword, advanced, and semantic search

**Files:**
- Modify: `frontend/src/views/CourseList.vue`

**Steps:**
1. Replace the computed local filter with a debounced `/courses/search` request.
2. Add level, semester, assessment type, and credit-bound controls.
3. Add an authenticated semantic-search mode that reuses the filters and course cards.
4. Handle empty, loading, error, and login-required states.

### Task 4: Complete review ownership and reporting workflows

**Files:**
- Modify: `backend/src/routes/reviewRoutes.js`
- Modify: `backend/src/controllers/reviewController.js`
- Modify: `backend/src/services/reviewService.js`
- Modify: `frontend/src/api/reviews.js`
- Modify: `frontend/src/views/CourseDetail.vue`
- Modify: `frontend/src/views/ModerationDashboard.vue`

**Steps:**
1. Add an authenticated current-user review lookup for a course.
2. Add report status resolution for moderators/admins.
3. Prefill the review form for the owner and call update instead of create.
4. Add report actions for other users' reviews and a report queue with resolve, dismiss, and hide actions.
5. Run backend syntax checks and the frontend build.

### Task 5: Add administrator course editing

**Files:**
- Modify: `backend/src/controllers/courseController.js`
- Modify: `backend/src/services/courseService.js`
- Modify: `frontend/src/views/AdminDashboard.vue`

**Steps:**
1. Validate editable fields and support replacing prerequisite relationships.
2. Add a searchable course table and edit dialog covering core metadata, semester, assessment, active status, and prerequisites.
3. Refresh the list after a successful update.
4. Verify role-protected operations through build and route inspection.

### Task 6: Finish profile, dashboard, auth recovery, and registration consistency

**Files:**
- Modify: `backend/src/controllers/authController.js`
- Modify: `backend/src/services/userService.js`
- Modify: `backend/src/controllers/userController.js`
- Modify: `frontend/src/api/auth.js`
- Modify: `frontend/src/stores/auth.js`
- Modify: `frontend/src/views/Profile.vue`
- Modify: `frontend/src/views/Dashboard.vue`
- Modify: `frontend/src/views/Login.vue`
- Modify: `frontend/src/views/Register.vue`
- Create: `frontend/src/views/ForgotPassword.vue`
- Create: `frontend/src/views/ResetPassword.vue`
- Modify: `frontend/src/router/index.js`

**Steps:**
1. Persist `major` and integer `studyYear` during registration and validate profile payloads.
2. Build profile editing for scalar, list, JSON preferences, and completed courses.
3. Build a dashboard summary from profile, saved courses, and plans, with an AI recommendation entry point.
4. Add forgot-password and reset-code pages and guest routes.
5. Run backend syntax checks, backend tests where database configuration permits, and `npm run build` in `frontend`.

### Task 7: Final verification

**Files:**
- Inspect all modified files and `git diff`.

**Steps:**
1. Run `node --check` on changed backend JavaScript files.
2. Run the frontend production build.
3. Run backend tests and distinguish code failures from unavailable external database/services.
4. Review `git diff --check` and ensure no localStorage references remain for saved courses or planner data.
