# English Code Comments Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add concise English documentation to every maintained frontend and backend source file without changing application behavior, then integrate and push the result to `master`.

**Architecture:** Treat comments as documentation-only changes. Add a file-level responsibility comment to each maintained source/configuration file, translate existing Chinese comments, and add rationale comments only around non-obvious validation, persistence, authentication, AI retrieval, and planning logic. Do not edit historical Prisma migrations, generated lock files, or binary/generated assets because changing them can invalidate migration checksums or generated output.

**Tech Stack:** Vue 3 SFC, Pinia, Vite, Express, Prisma, JavaScript/TypeScript, CSS, HTML, GitHub Actions.

---

### Task 1: Audit comment coverage

**Files:**
- Inspect: `frontend/src/**/*.{js,vue,css}`
- Inspect: `backend/{app.js,prisma.config.ts,prisma/schema.prisma,prisma/seed.js}`
- Inspect: `backend/src/**/*.js`
- Inspect: `backend/scripts/*.js`
- Inspect: `.github/workflows/ci.yml`, `frontend/index.html`, `frontend/vite.config.js`, `backend/test-db.js`

**Steps:**
1. Enumerate tracked maintained source files.
2. Identify missing file-level comments and non-English comments.
3. Exclude immutable migration SQL and generated files from mutation.

### Task 2: Document backend code

**Files:**
- Modify: `backend/app.js`
- Modify: `backend/prisma.config.ts`
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/prisma/seed.js`
- Modify: `backend/src/**/*.js`
- Modify: `backend/scripts/*.js`
- Modify: `backend/test-db.js`

**Steps:**
1. Add concise module responsibility comments.
2. Translate Chinese comments to English.
3. Explain non-obvious authorization, transaction, validation, retrieval, and persistence decisions.
4. Run backend tests and smoke checks available through package scripts.

### Task 3: Document frontend code

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/vite.config.js`
- Modify: `frontend/src/**/*.{js,vue,css}`

**Steps:**
1. Add concise module/component responsibility comments.
2. Translate Chinese JavaScript and template comments to English.
3. Explain state persistence, API boundaries, route guards, and complex UI state transitions.
4. Run the production build and confirm Vue SFC parsing succeeds.

### Task 4: Verify and publish

**Steps:**
1. Search maintained source files for remaining Chinese comments and conflict markers.
2. Review the diff to ensure comments are the only intentional edits.
3. Commit comment changes on `YinchenGuo` without staging the pre-existing deleted plan file.
4. Synchronize local `master`, merge `YinchenGuo`, rerun verification, and push `master` to `origin` without force.
