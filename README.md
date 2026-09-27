# CourseCompass

**CourseCompass** is a full-stack university course-planning web application designed to help students discover, compare, organise, and plan university courses more effectively.

The platform combines traditional course-management features with **semantic search and AI-assisted recommendations**, allowing students to explore courses based not only on keywords, but also on their interests, academic goals, and planning preferences.

---

## Overview

University course planning can involve information spread across course catalogues, prerequisite rules, semester availability, reviews, and programme requirements.

CourseCompass brings these functions together into one platform where students can:

- Browse and search university courses
- Compare courses
- Save and track completed courses
- Build multi-semester study plans
- Read and submit course reviews
- Receive AI-assisted course recommendations
- Generate AI summaries of course reviews
- Manage personal study preferences

The project was developed as a university team project with a focus on full-stack development, database design, and practical AI integration.

---

## Main Features

### Course Discovery

- Browse the course catalogue
- View course descriptions, credits, prerequisites, workload, semesters, and assessments
- Search courses using keywords
- Search courses using semantic similarity
- Filter and compare courses

### Study Planning

- Save courses for later
- Track completed courses
- Create multi-semester study plans
- Manage course-planning preferences
- View prerequisite relationships

### Reviews

- Submit course reviews
- Browse approved reviews
- Report inappropriate reviews
- Moderator review-management workflow
- In-app moderation notifications
- AI-generated review summaries

### AI Features

- Semantic course search
- AI-assisted course recommendations
- AI-generated recommendation explanations
- AI-assisted course comparison
- AI-generated review summaries

### Account Management

- Student registration
- Login and authentication
- Password reset by email
- Student profile management
- Role-based access for students, moderators, and administrators

### Administration

- Course management
- Review moderation
- User-role management
- Course-data maintenance

---

## Technology Stack

### Frontend

- Vue 3
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios

### Backend

- Node.js
- Express
- Prisma ORM
- JWT
- bcrypt
- Nodemailer

### Database

- PostgreSQL
- Supabase
- pgvector

### AI

- SiliconFlow
- BAAI/bge-m3
- Zhipu AI

---

## System Architecture

```text
                         ┌─────────────────────┐
                         │       Student       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Vue 3 Frontend   │
                         │  Vite / Pinia / UI  │
                         └──────────┬──────────┘
                                    │
                              REST API / Axios
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Express Backend   │
                         │ Authentication      │
                         │ Business Logic      │
                         │ AI Services         │
                         └───────┬───────┬─────┘
                                 │       │
                    Prisma ORM   │       │ AI APIs
                                 ▼       ▼
                    ┌────────────────┐  ┌──────────────────┐
                    │ PostgreSQL     │  │ SiliconFlow      │
                    │ Supabase       │  │ BAAI/bge-m3      │
                    │ pgvector       │  │ Zhipu AI         │
                    └────────────────┘  └──────────────────┘
```

---

## How AI Recommendation Works

CourseCompass combines vector-based semantic retrieval with large-language-model-generated explanations.

```text
Student Preferences
        │
        ▼
Create Search Query
        │
        ▼
Generate Query Embedding
        │
        ▼
Vector Similarity Search
        │
        ▼
Retrieve Relevant Courses
        │
        ▼
Course Information + Preferences
        │
        ▼
Zhipu AI
        │
        ▼
Recommendation Explanation
        │
        ▼
Recommended Courses
```

Course embeddings are generated using SiliconFlow's **BAAI/bge-m3** embedding model.

Each course is represented by a **1024-dimensional vector**, which is stored in PostgreSQL using the `pgvector` extension.

When a student requests recommendations, CourseCompass generates an embedding from the student's preferences and performs vector similarity search against stored course embeddings.

Relevant courses are then provided to the language model to generate user-friendly recommendation explanations.

---

## Project Structure

```text
CourseCompass/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   ├── router/
│   │   └── services/
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── tests/
│   ├── app.js
│   └── package.json
│
└── README.md
```

The exact directory structure may evolve as the project is developed.

---

## Requirements

Before running the project, make sure the following are available:

- Node.js 18+
- npm
- PostgreSQL with `pgvector` support
- Zhipu AI API key
- SiliconFlow API key
- SMTP credentials for password-reset emails

---

## Environment Configuration

### Backend

Create:

```text
backend/.env
```

Example:

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

Never commit `.env` files, passwords, API keys, or other credentials to Git.

### Frontend

Create:

```text
frontend/.env.development
```

Example:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_USE_MOCK="false"
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CourseCompass
```

### 2. Start the Backend

```bash
cd backend
npm ci
npx prisma generate
npm run dev
```

The backend runs at:

```text
http://localhost:3000
```

For a standard non-development start:

```bash
npm start
```

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm ci
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The frontend communicates with the backend through:

```text
http://localhost:3000/api
```

---

## Database Setup

The Prisma schema is located at:

```text
backend/prisma/schema.prisma
```

Database migrations are stored in:

```text
backend/prisma/migrations/
```

If the connected database already contains the CourseCompass schema and course data, normal development usually requires only:

```bash
npx prisma generate
npm run dev
```

To provision a database using the repository's existing migrations and generate missing course embeddings:

```bash
npm run setup
```

The setup process:

1. Validates the Prisma schema
2. Generates Prisma Client
3. Applies existing database migrations
4. Generates missing course embeddings
5. Checks migration status

`npm run setup` does not create demo accounts or insert demo course data.

---

## Database Development

After modifying `schema.prisma`, validate the schema:

```bash
npx prisma validate
```

Create a migration:

```bash
npx prisma migrate dev --name migration-name
```

Example:

```bash
npx prisma migrate dev --name add-course-status
```

Regenerate Prisma Client when required:

```bash
npx prisma generate
```

Existing migrations are deployed during project setup using:

```bash
npx prisma migrate deploy
```

---

## Prisma Studio

To inspect the database using Prisma's graphical interface:

```bash
cd backend
npx prisma studio
```

---

## AI Embeddings

CourseCompass uses SiliconFlow's **BAAI/bge-m3** model for course embeddings.

Embeddings are stored as **1024-dimensional vectors** in PostgreSQL using `pgvector`.

### Generate Missing Embeddings

```bash
npm run embeddings:generate
```

Only courses without an existing embedding are processed.

### Rebuild All Embeddings

```bash
npm run embeddings:rebuild
```

This regenerates embeddings for every course.

For an existing database with valid embeddings, regeneration is not required.

---

## Testing

Run the backend test suite with:

```bash
cd backend
npm test
```

The backend uses Node.js's built-in test runner.

Tests cover areas including:

- Backend validation
- Password policies
- Rate limiting
- Health checks
- Background embedding jobs
- User services
- Course services
- Database constraints
- Course prerequisites
- Reviews and related database behaviour

Some integration tests connect to the configured database and create temporary records.

Use an isolated development or test database when running integration tests rather than a populated production or shared database.

---

## Frontend Production Build

To verify the frontend production build:

```bash
cd frontend
npm run build
```

The output is generated in:

```text
frontend/dist/
```

Preview the production build locally with:

```bash
npm run preview
```

---

## Useful Backend Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start backend development server |
| `npm start` | Start backend normally |
| `npm run setup` | Apply migrations and generate missing embeddings |
| `npm test` | Run backend tests |
| `npm run embeddings:generate` | Generate missing course embeddings |
| `npm run embeddings:rebuild` | Rebuild all course embeddings |
| `npx prisma studio` | Open Prisma Studio |
| `npx prisma validate` | Validate Prisma schema |
| `npx prisma generate` | Generate Prisma Client |

---

## Accounts and Roles

Project setup does not automatically create user accounts.

Students may register directly through the application.

CourseCompass currently supports the following roles:

- `STUDENT`
- `MODERATOR`
- `ADMIN`

Administrator and moderator accounts must be provisioned separately.



## Key Technical Challenges

Several technical challenges were addressed during the development of CourseCompass.

### Semantic Course Retrieval

Traditional keyword search may fail when a student's interests do not exactly match wording in course descriptions.

CourseCompass addresses this by representing course information as embedding vectors and retrieving courses based on semantic similarity.

### AI Integration

The AI recommendation system separates retrieval from explanation generation.

Vector search first identifies potentially relevant courses, while the language model is used to explain recommendations rather than directly selecting from the entire catalogue.

### Database and Vector Integration

CourseCompass integrates Prisma-managed relational data with PostgreSQL `pgvector` for semantic search while maintaining normal course, prerequisite, review, and account relationships.

### Full-Stack Integration

The project connects the Vue frontend, Express REST API, Prisma data layer, PostgreSQL database, authentication system, and external AI services into a single application workflow.

---

## Known Limitations

- AI features depend on external AI API availability.
- Recommendation quality depends on the quality and completeness of stored course information.
- Course embeddings must be generated before semantic retrieval can operate correctly.
- Programme requirements and official course rules may change over time.
- AI-generated recommendations should be treated as planning assistance rather than authoritative academic advice.

Students should verify final course selections and programme requirements using official university information.

---

## Future Improvements

Potential future improvements include:

- Hybrid keyword and semantic search
- More advanced recommendation-ranking strategies
- Dynamic retrieval parameters
- Improved AI recommendation evaluation
- More comprehensive course datasets
- Improved prerequisite visualisation
- Additional recommendation personalisation
- Improved administrator analytics
- Deployment automation and monitoring

---

## Dependency Management

Use:

```bash
npm ci
```

for clean installations based on the committed `package-lock.json`.

Use:

```bash
npm install
```

when adding, removing, or updating dependencies.

Do not commit:

```text
node_modules/
```

---

## Security Notes

- Never commit `.env` files.
- Never commit API credentials.
- Never commit database passwords.
- Use a strong random `JWT_SECRET`.
- Configure `CORS_ORIGIN` appropriately in production.
- Use isolated databases when running integration tests.
- AI-generated output should not replace official university programme information.

---

## Academic Project

CourseCompass was developed as a university software-development project for educational purposes.

The repository demonstrates practical experience with:

- Full-stack web development
- REST API development
- Relational database design
- Authentication and role-based access control
- Vector databases
- Semantic search
- Embedding models
- Large language model integration
- AI-assisted recommendation systems
- Automated testing
- Team-based software development
