# CourseCompass Database Service Contracts

## 1. Purpose

This document describes the database Service functions currently available to the CourseCompass backend.

Controllers should call Service functions instead of accessing Prisma directly.

The current database Services are:

```text
src/services/userService.js
src/services/courseService.js
```

## 2. Shared Prisma Client

The shared Prisma Client is defined in:

```text
src/lib/prisma.js
```

Service files may import it using:

```javascript
const prisma = require('../lib/prisma');
```

Rules:

- Do not create `new PrismaClient()` inside controllers.
- Do not create a new Prisma Client for each request.
- Do not access Prisma directly from route files.
- Database queries should normally remain inside Service files.
- Always use the shared Prisma instance.

## 3. User Service

File:

```text
src/services/userService.js
```

### 3.1 `normalizeEmail(email)`

Purpose:

- Removes leading and trailing spaces.
- Converts email addresses to lowercase.

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

Possible error:

- Throws `TypeError` when email is empty or not a string.

### 3.2 `findUserForAuthenticationByEmail(email)`

Purpose:

- Finds a user during login.
- Returns the password hash required for bcrypt verification.

Example:

```javascript
const user =
    await userService.findUserForAuthenticationByEmail(email);
```

Successful return value:

```javascript
{
    id,
    email,
    passwordHash,
    name,
    role,
    major
}
```

When the email does not exist:

```javascript
null
```

Security rule:

`passwordHash` is returned only because the authentication module needs it. It must never be returned in an HTTP response or stored inside the JWT payload.

### 3.3 `findPublicUserById(id)`

Purpose:

- Finds a user by primary key.
- Returns only fields that are safe for normal application responses.

Example:

```javascript
const user = await userService.findPublicUserById(userId);
```

Successful return value:

```javascript
{
    id,
    email,
    name,
    role,
    major,
    createdAt,
    updatedAt
}
```

When the user does not exist:

```javascript
null
```

The result does not contain `passwordHash`.

### 3.4 `createUser(data)`

Purpose:

- Creates a standard student account.
- Normalises the email before writing it.
- Prevents public registration from assigning privileged roles.

Input:

```javascript
{
    email,
    passwordHash,
    name,
    major
}
```

Example:

```javascript
const passwordHash = await bcrypt.hash(password, 10);

const user = await userService.createUser({
    email,
    passwordHash,
    name,
    major
});
```

Requirements:

- The caller must hash the password before calling the Service.
- `email` must be a non-empty string.
- `passwordHash` must be a non-empty string.
- `name` must be a non-empty string.
- `major` is optional.
- Public registration must not accept a user-provided role.

The database applies the default role:

```text
STUDENT
```

Safe return value:

```javascript
{
    id,
    email,
    name,
    role,
    major,
    createdAt,
    updatedAt
}
```

## 4. Course Service

File:

```text
src/services/courseService.js
```

### 4.1 `getAllCourses(options)`

Purpose:

- Returns active courses from PostgreSQL.
- Supports basic offset pagination.

Optional input:

```javascript
{
    skip,
    take
}
```

Example:

```javascript
const courses = await courseService.getAllCourses({
    skip: 0,
    take: 20
});
```

Default behaviour:

- `skip` defaults to `0`.
- `take` defaults to `50`.
- `take` is limited to a maximum of `100`.
- Invalid pagination values are replaced with safe defaults.
- Only courses with `isActive: true` are returned.
- Courses are sorted by `code` in ascending order.

Returned course fields:

```javascript
{
    id,
    code,
    name,
    description,
    credits,
    workloadHours,
    isActive,
    createdAt,
    updatedAt
}
```

Naming requirement:

The database and API use `name` for the course name. Backend and frontend code should not use `title` for the same field.

## 5. Authentication Integration

The Backend Developer should implement login using this sequence:

```text
Login request
    ↓
Validate email and password
    ↓
findUserForAuthenticationByEmail(email)
    ↓
bcrypt.compare(password, user.passwordHash)
    ↓
Create JWT
    ↓
Return safe user data
```

Example:

```javascript
const bcrypt = require('bcryptjs');
const userService = require('../services/userService');

const user =
    await userService.findUserForAuthenticationByEmail(email);

if (!user) {
    return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
    });
}

const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
);

if (!passwordMatches) {
    return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
    });
}

const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    major: user.major
};
```

Authentication security requirements:

- Use the same error message for an unknown email and an incorrect password.
- Never return `passwordHash`.
- Never place `passwordHash` in a JWT.
- Never log passwords or password hashes.
- Public registration must always create a `STUDENT`.
- Moderator and administrator roles must be assigned through authorised administration logic.

## 6. Course Controller Integration

The existing Controller may call:

```javascript
const courses = await courseService.getAllCourses();
```

For pagination, query values must first be converted from strings to integers:

```javascript
const skip = Number.parseInt(req.query.skip, 10);
const take = Number.parseInt(req.query.take, 10);

const courses = await courseService.getAllCourses({
    skip,
    take
});
```

The Service applies safe defaults when these values are invalid.

## 7. Prisma Error Handling

Controllers should catch Service errors and convert them into safe HTTP responses.

Recommended mappings:

| Error | Meaning | Suggested HTTP response |
|---|---|---|
| `TypeError` | Invalid Service input | `400 Bad Request` |
| `P2002` | Unique constraint violation | `409 Conflict` |
| `P2003` | Foreign-key constraint violation | `409 Conflict` |
| `P2004` or database constraint error | Value rejected by database constraint | `400 Bad Request` |
| `P2025` | Required database record not found | `404 Not Found` |
| Database connection failure | Database unavailable | `500 Internal Server Error` |

Example:

```javascript
try {
    const user = await userService.createUser(data);

    return res.status(201).json({
        success: true,
        data: user
    });
} catch (error) {
    if (error.code === 'P2002') {
        return res.status(409).json({
            success: false,
            message: 'Email already exists'
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Server error'
    });
}
```

Do not return the following information to frontend clients:

- Raw Prisma errors
- SQL statements
- Stack traces
- Database connection strings
- Internal file paths

## 8. Current Responsibilities

### Database Engineer

Responsible for:

- Prisma Schema
- PostgreSQL migrations
- Database constraints
- Database indexes
- Seed data
- Prisma queries inside Service files
- Database tests
- Database documentation

### Backend Developer

Responsible for:

- Express routes
- Controllers
- Request validation
- Password hashing workflow
- JWT generation and verification
- Authentication middleware
- HTTP status codes and responses
- Role-based access control

Changes to Service function names or return structures should be discussed before implementation because they may affect Controllers and frontend API contracts.

## 9. Verification Commands

Before integrating database changes, run:

```powershell
npx.cmd prisma validate
npx.cmd prisma migrate status
npm.cmd test
```

All three commands must succeed before the change is merged.