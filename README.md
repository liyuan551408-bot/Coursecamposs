# CourseCompass

CourseCompass is a full-stack university course planning application. It helps students browse courses, compare options, save courses, build semester plans, and use AI-assisted recommendations and review summaries.

## Tech Stack

- Frontend: Vue 3, Vite, Vue Router, Pinia, Element Plus, Axios
- Backend: Node.js, Express, Prisma, PostgreSQL
- Authentication: JWT, bcrypt password hashing
- Email: Nodemailer password reset emails
- AI: Zhipu AI embeddings and chat completion APIs

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
- Password reset email support
- Prisma-backed PostgreSQL schema with seed data and smoke tests

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL database
- Zhipu AI API key for AI features
- SMTP credentials for password reset emails

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-a-secure-secret"
ZHIPU_API_KEY="replace-with-your-zhipu-api-key"
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
```

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
- `GET /api/courses`
- `POST /api/ai/test-embedding`
- `POST /api/ai/semantic-search`
- `POST /api/ai/recommend`
- `GET /api/ai/courses/:id/summary`

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
- AI features require `ZHIPU_API_KEY`.
- Password reset emails require valid SMTP settings.
- Additional database details are documented in `backend/docs/database/README.md`.
