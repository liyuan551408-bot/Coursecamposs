# CourseCompass

CourseCompass is a full-stack university course-planning application that helps students browse, compare, save, plan, review, and receive AI-assisted course recommendations.

## Technology Stack

- Frontend: Vue 3, Vite, Vue Router, Pinia, Element Plus, Axios
- Backend: Node.js, Express, Prisma, JWT, bcrypt, Nodemailer
- Database: PostgreSQL, Supabase, pgvector
- AI: SiliconFlow BAAI/bge-m3 and Zhipu AI

## Main Features

- Course catalogue, course details, prerequisites, credits, workload, semesters, and assessments
- Keyword search and semantic search
- Course filtering and comparison
- Saved and completed courses
- Multi-semester study planning
- Course reviews and reports
- Review moderation and in-app notifications
- AI-assisted course recommendations
- AI-generated review summaries
- AI-assisted course comparison
- Student profile and planning-preference management
- Administrator course management
- Registration, login, and password reset

## Requirements

Before running the project, make sure the following are available:

- Node.js 18+
- npm
- PostgreSQL database with pgvector support
- Zhipu AI API key
- SiliconFlow API key
- SMTP credentials for password-reset emails

## Environment Configuration

### Backend

Create `backend/.env`.

Example configuration:

- `DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"`
- `JWT_SECRET="replace-with-a-secure-secret"`
- `ZHIPU_API_KEY="replace-with-your-zhipu-api-key"`
- `SILICONFLOW_API_KEY="replace-with-your-siliconflow-api-key"`
- `SMTP_HOST="smtp.example.com"`
- `SMTP_PORT="465"`
- `SMTP_USER="your-app@example.com"`
- `SMTP_PASS="your-app-password"`

Do not commit the `.env` file to Git.

### Frontend

Create `frontend/.env.development`.

Example configuration:

- `VITE_API_BASE_URL="http://localhost:3000/api"`
- `VITE_USE_MOCK="false"`

## Local Setup

### Backend

For a cloud database that already has the CourseCompass schema and data, set `DATABASE_URL`, then run `cd backend`, `npm ci`, `npx prisma generate`, and `npm run dev`. The backend reads courses and accounts from that database.

Run `npm run setup` only when you intend to apply the repository's migrations and generate missing course embeddings on the database in `DATABASE_URL`.

The `npm run setup` command automatically performs the following steps:

1. Validates the Prisma schema
2. Generates Prisma Client
3. Applies existing database migrations
4. Generates missing course embeddings
5. Verifies the migration status

After the setup is complete, start the backend with `npm run dev`.

The backend runs at `http://localhost:3000`.

For a normal non-development start, use `npm start`.

### Frontend

Open a second terminal and run `cd frontend`, followed by `npm ci` and `npm run dev`.

The frontend runs at `http://localhost:5173`.

The frontend communicates with the backend through `http://localhost:3000/api`.

## Backend Commands

### Project Setup

Run `npm run setup` when provisioning a database or generating missing course embeddings.

This includes Prisma schema validation, Prisma Client generation, database migration deployment, course embedding generation, and migration status verification. It does not insert demo data.

### Development Server

Run `npm run dev` to start the backend using Nodemon.

The server automatically restarts when backend source files change.

### Normal Server Start

Run `npm start` to start the backend using `node app.js` without automatic restart.

## Database

The Prisma schema is located at `backend/prisma/schema.prisma`.

Database migrations are stored in `backend/prisma/migrations/`.

Existing migrations are automatically applied when running `npm run setup`.

### Creating a New Migration During Development

After modifying `schema.prisma`, validate the schema with `npx prisma validate`.

Create a new migration with `npx prisma migrate dev --name migration-name`.

For example, `npx prisma migrate dev --name add-course-status`.

Regenerate Prisma Client if required with `npx prisma generate`.

`prisma migrate dev` is intended for development when creating new migrations.

For normal project setup, existing migrations are applied using `prisma migrate deploy`, which is already included in `npm run setup`.

### Prisma Studio

Run `npx prisma studio` to inspect the database using Prisma's graphical interface.

## AI Embeddings

CourseCompass uses SiliconFlow's `BAAI/bge-m3` embedding model.

Course embeddings are stored as 1024-dimensional vectors using PostgreSQL `pgvector`.

### Generate Missing Embeddings

Run `npm run embeddings:generate`.

This generates embeddings only for courses that do not currently have an embedding.

### Rebuild All Embeddings

Run `npm run embeddings:rebuild`.

This regenerates embeddings for all courses.

Embedding generation is included in `npm run setup`. An existing cloud database with course embeddings needs no generation step.

## Testing

Run the complete backend test suite with `cd backend` followed by `npm test`.

The backend uses Node.js's built-in test runner.

The test suite includes coverage for:

- Backend validation rules
- Password policy
- Rate limiting
- Health checks
- Background embedding jobs
- User services
- Course services
- Database constraints
- Course prerequisites
- Reviews and related database behaviour

Some integration tests connect to the configured database and create temporary records. Run them against an isolated development or test database, not a populated cloud database.

Temporary test data is cleaned up after the tests complete.

## Frontend Production Build

Run `cd frontend` followed by `npm run build` to verify that the frontend can be built successfully.

The production build is generated in `frontend/dist/`.

Run `npm run preview` to preview the production build locally.

## Recommended First Run

After cloning the repository, use the following workflow.

### Backend

1. `cd backend`
2. `npm ci`
3. `npx prisma generate`
4. `npm run dev`

Run `npm run setup` separately if this database needs the repository's migrations or missing course embeddings. Run `npm test` against an isolated development or test database.

### Frontend

Open a second terminal and run:

1. `cd frontend`
2. `npm ci`
3. `npm run build`
4. `npm run dev`

## Accounts

Setup does not create accounts. Use accounts already present in the connected database or register a student account through the application. Administrator and moderator roles must be provisioned separately.

## Dependency Management

Use `npm ci` for a clean installation based on the committed `package-lock.json`.

Use `npm install` when adding, removing, or updating project dependencies during development.

Do not commit `node_modules/` to the repository.

## Security Notes

- Never commit `.env` files or API credentials.
- Never commit database passwords.
- Use a strong random `JWT_SECRET`.
- Configure `CORS_ORIGIN` appropriately in production.
- AI-generated output is planning assistance only.
- Course prerequisites and programme requirements should be verified against official university information.
