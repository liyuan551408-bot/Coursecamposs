# CourseCompass

CourseCompass is a full-stack university course-planning application. It helps students browse, compare, save, plan, review, and receive AI-assisted course recommendations.

## Technology Stack

- Frontend: Vue 3, Vite, Vue Router, Pinia, Element Plus, Axios
- Backend: Node.js, Express, Prisma, JWT, bcrypt, Nodemailer
- Database: PostgreSQL, Supabase, pgvector
- AI: SiliconFlow BAAI/bge-m3 and Zhipu AI

## Main Features

- Course catalogue, details, prerequisites, credits, workload, semesters, and assessments
- Keyword and semantic search, filtering, and course comparison
- Saved courses, completed courses, and multi-semester plans
- Course reviews, reports, moderation, and in-app notifications
- AI recommendations, review summaries, and course comparison analysis
- Student profile and planning-preference management
- Administrator course management and review moderation
- Registration, login, and password reset

## Local Setup

Requirements: Node.js 18+, PostgreSQL, AI API keys, and SMTP credentials.

Configure `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-a-secure-secret"
ZHIPU_API_KEY="replace-with-your-zhipu-api-key"
SILICONFLOW_API_KEY="replace-with-your-siliconflow-api-key"
SMTP_HOST="smtp.example.com"
SMTP_PORT="465"
SMTP_USER="your-app@example.com"
SMTP_PASS="your-app-password"
```

Configure `frontend/.env.development`:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_USE_MOCK="false"
```

Install and start the backend:

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Default addresses: frontend `http://localhost:5173`, backend `http://localhost:3000`.

## Database and AI Embeddings

The database schema is defined in `backend/prisma/schema.prisma`. Versioned migrations are stored in `backend/prisma/migrations/`.

After a schema change, run:

```powershell
cd backend
npx prisma validate
npx prisma generate
npx prisma migrate deploy
```

Course embeddings use 1024-dimensional pgvector values. Generate or rebuild embeddings with:

```powershell
npm run embeddings:generate
npm run embeddings:generate -- --force
```

## Testing and Production Build

Run the backend test and smoke-test suite:

```powershell
cd backend
npm test
npm run db:permission-check
```

Build the frontend:

```powershell
cd frontend
npm run build
```

The backend smoke tests connect to the configured database and create/remove temporary test records.

## Development Accounts

These accounts are created by the seed script:

| Role | Email | Password |
|---|---|---|
| Student | `student@coursecompass.test` | `CourseCompass123!` |
| Moderator | `moderator@coursecompass.test` | `CourseCompass123!` |
| Administrator | `admin@coursecompass.test` | `CourseCompass123!` |

Use these accounts only for development and testing. Never use them in production.

## Security Notes

- Never commit `.env` files, database credentials, or API keys.
- Use a strong random `JWT_SECRET` in production.
- Set `CORS_ORIGIN` to the production frontend origin.
- AI output is planning assistance only; verify prerequisites and programme rules against official university information.
