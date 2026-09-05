# CourseCompass

CourseCompass is a full-stack university course planning application. It helps students browse courses, compare options, save courses, build semester plans, and use AI-assisted recommendations and review summaries.

## Tech Stack

- Frontend: Vue 3, Vite, Vue Router, Pinia, Element Plus, Axios
- Backend: Node.js, Express, Prisma, PostgreSQL
- Authentication: JWT, bcrypt password hashing
- Email: Nodemailer password reset emails
- AI: SiliconFlow embeddings and Zhipu AI chat completion APIs

## Repository Structure

```text
courseCompass/
  backend/    Express API, Prisma schema, database scripts, smoke tests
  frontend/   Vue application
  package.json
```

## Features

- Course browsing and course detail pages
- User registration and login
- Role-aware navigation for student and admin users
- Saved courses and semester planning views
- Course comparison views
- AI course recommendations based on semantic search
- AI-generated course review summaries
- 1024-dimensional pgvector embeddings for course search
- Password reset email support
- Prisma-backed PostgreSQL schema with seed data and smoke tests

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL database
- SiliconFlow API key for embeddings and Zhipu AI API key for chat features
- SMTP credentials for password reset emails

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-a-secure-secret"
ZHIPU_API_KEY="replace-with-your-zhipu-api-key"
SILICONFLOW_API_KEY="replace-with-your-siliconflow-api-key"
SILICONFLOW_EMBEDDING_MODEL="BAAI/bge-m3"
SMTP_HOST="smtp.example.com"
SMTP_PORT="465"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password-or-app-password"
```

Create `frontend/.env.development` if you need to override frontend defaults:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_USE_MOCK="false"
```

## Install Dependencies

Install backend dependencies:

```powershell
cd backend
npm install
```

Install frontend dependencies:

```powershell
cd frontend
npm install
```

## Database Setup

From the `backend` directory:

```powershell
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run embeddings:generate
```

The embedding command generates vectors for courses whose `embedding` is missing. It uses the course code, name, description, level, offered semesters, assessment types, workload hours, and official link. To rebuild every course vector after changing this text format, run:

```powershell
cd backend
npm run embeddings:generate -- --force
```

Embeddings are generated through SiliconFlow using `BAAI/bge-m3` and stored in `Course.embedding` as `vector(1024)` values. The AI search uses cosine similarity, returns only active courses with a similarity of at least `0.35`, and accepts a result limit from `1` to `10`. When migrating from another embedding model, deploy the database migration and regenerate all vectors with `npm run embeddings:generate -- --force` before using semantic search.

Development seed accounts:

| Role | Email | Password |
|---|---|---|
| Student | `student@coursecompass.test` | `CourseCompass123!` |
| Moderator | `moderator@coursecompass.test` | `CourseCompass123!` |
| Administrator | `admin@coursecompass.test` | `CourseCompass123!` |

## Run Locally

Start the backend API:

```powershell
cd backend
npm run dev
```

Start the frontend:

```powershell
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`

## Useful Commands

Frontend:

```powershell
cd frontend
npm run build
npm run preview
```

Backend:

```powershell
cd backend
npm start
npm test
npm run db:status
npm run db:seed
npm run embeddings:generate
npm run embeddings:generate -- --force
```

Prisma:

```powershell
cd backend
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate status
```

## API Overview

Main backend routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/users/me` (authenticated)
- `PATCH /api/users/me` (authenticated)
- `GET /api/courses`
- `POST /api/courses` (administrator only)
- `PATCH /api/courses/:id` (administrator only)
- `POST /api/ai/test-embedding` (administrator only)
- `POST /api/ai/semantic-search` (authenticated)
- `POST /api/ai/recommend` (authenticated)
- `GET /api/ai/courses/:id/summary` (rate limited)

All AI routes are rate limited to 20 requests per IP/user per 15-minute window. The current limiter is in-memory and should be replaced with a shared Redis or gateway limiter for multi-instance production deployments.

## Verification

The current frontend production build can be verified with:

```powershell
cd frontend
npm run build
```

Backend smoke tests require a valid database connection:

```powershell
cd backend
npm test
```

## Notes

- Do not commit real `.env` files or secrets.
- Embeddings require `SILICONFLOW_API_KEY`; AI chat features require `ZHIPU_API_KEY`.
- Password reset emails require valid SMTP settings.
- Additional database details are documented in `backend/docs/database/README.md` and the related files in `backend/docs/database/`.
