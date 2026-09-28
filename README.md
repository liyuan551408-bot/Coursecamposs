# CourseCompass

**CourseCompass** is a full-stack university course-planning web application designed to help students discover, compare, organise, and plan university courses more effectively.

The project combines traditional course-planning functions with practical AI features. Students can browse course information, search and compare courses, manage saved and completed courses, build study plans, submit reviews, and receive AI-assisted course recommendations.

CourseCompass uses a **Vue 3** frontend, an **Express / Node.js** backend, **Prisma ORM** with **PostgreSQL / Supabase**, and AI services including **SiliconFlow BAAI/bge-m3** embeddings and **Zhipu AI**.

---

## Project Structure

```text
Coursecamposs/
├── backend/
│   ├── prisma/
│   │   ├── migrations/          # Database migrations
│   │   └── schema.prisma        # Prisma database schema
│   ├── scripts/                 # Utility and embedding scripts
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── lib/                 # Shared backend libraries
│   │   ├── middlewares/         # Authentication and middleware
│   │   ├── routes/              # REST API routes
│   │   ├── services/            # Business logic and AI services
│   │   └── utils/               # Backend utilities
│   ├── test/                    # Backend tests
│   ├── .env.example             # Backend environment template
│   ├── app.js                   # Backend entry point
│   ├── prisma.config.ts         # Prisma configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # API request modules
│   │   ├── components/          # Reusable Vue components
│   │   ├── images/              # Image assets
│   │   ├── router/              # Vue Router configuration
│   │   ├── stores/              # Pinia stores
│   │   ├── utils/               # Frontend utilities
│   │   ├── views/               # Application pages
│   │   ├── App.vue              # Root Vue component
│   │   └── main.js              # Frontend entry point
│   ├── test/                    # Frontend tests
│   ├── .env.example             # Frontend environment template
│   ├── vite.config.js
│   └── package.json
│
├── .github/                     # GitHub workflow configuration
└── README.md
```

---

## Installation and Running

### Requirements

Before running the project, make sure the following are available:

- **Node.js 22+**
- **npm**
- PostgreSQL database with **pgvector** support
- Required API keys and environment variables

Clone the repository:

```bash
git clone https://github.com/liyuan551408-bot/Coursecamposs.git
cd Coursecamposs
```

### Node.js Configuration

Check the currently installed Node.js and npm versions:

```bash
node -v
npm -v
```

The project requires **Node.js 22 or later**.

If you are using **NVM**, install and switch to Node.js 22:

```bash
nvm install 22
nvm use 22
```

Verify the active version:

```bash
node -v
```

The output should be similar to:

```text
v22.x.x
```

If npm needs to be updated:

```bash
npm install -g npm@latest
```

Verify again:

```bash
node -v
npm -v
```

---

### Backend

Open a terminal and enter the backend directory:

```bash
cd backend
```

Run the following commands in order:

```bash
npm ci
npx prisma generate
npm run setup
npm test
npm run dev
```

The commands perform the following tasks:

```text
npm ci                Install dependencies from package-lock.json
npx prisma generate   Generate Prisma Client
npm run setup         Validate Prisma, apply migrations and prepare embeddings
npm test              Run the backend test suite
npm run dev           Start the backend development server
```

The backend runs at:

```text
http://localhost:3000
```

---

### Frontend

Open another terminal and enter the frontend directory:

```bash
cd frontend
```

Run:

```bash
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

Once both servers are running, open **http://localhost:5173** in your browser to use CourseCompass.
