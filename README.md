# School Management Backend

Simple Express + MongoDB API for a school management system.
Roles: `admin`, `teacher`, `student`.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/school-management
   JWT_SECRET=change_this_to_a_random_secret_string
   ```

3. Create the first admin account:
   ```
   node seed.js
   ```
   This creates `admin@school.com` / `admin123` — change the password after your first login.

4. (Optional) Fill the database with demo data — teachers, classes,
   students, grades and attendance records — so the dashboard has real
   content to explore:
   ```
   node seedDemoData.js
   ```
   This creates 6 teachers, 6 classes, and ~48 students, plus grades and
   attendance history for each student. All demo accounts share the
   password `password123`. Safe to re-run — it clears out the previous
   demo batch first (identified by their `@demo.brighthorizon.edu.jo`
   email domain) so you always get a fresh set.

5. Run the server:
   ```
   npm run dev
   ```
   The API will be running at `http://localhost:5000`.

## How the roles work

- There is no public registration route. Only an `admin` can create new users
  (teachers and students) via `POST /api/users`.
- When creating a `student`, pass their `classId` so they're linked to a class.
- `teacher` and `admin` can manage grades/attendance for any class.
- `student` can only view (GET) their own grades and attendance — the backend
  filters these automatically based on the logged-in user's id.

## Main endpoints

| Method | Route                        | Who                  |
|--------|------------------------------|-----------------------|
| POST   | /api/auth/login              | everyone              |
| GET    | /api/users                   | admin                 |
| POST   | /api/users                   | admin                 |
| PUT    | /api/users/:id                | admin                 |
| DELETE | /api/users/:id                | admin                 |
| GET    | /api/classes                 | logged-in users       |
| GET    | /api/classes/:id/students    | admin, teacher        |
| POST   | /api/classes                 | admin                 |
| PUT    | /api/classes/:id              | admin                 |
| DELETE | /api/classes/:id              | admin                 |
| GET    | /api/grades                  | logged-in users*      |
| POST   | /api/grades                  | admin, teacher        |
| PUT    | /api/grades/:id                | admin, teacher        |
| DELETE | /api/grades/:id                | admin, teacher        |
| GET    | /api/attendance              | logged-in users*      |
| POST   | /api/attendance              | admin, teacher        |
| PUT    | /api/attendance/:id            | admin, teacher        |
| DELETE | /api/attendance/:id            | admin, teacher        |

\* students only see their own records; admin/teacher see all (or filter with `?classId=`).

## Sending the token

After logging in, you get a `token`. Send it on every protected request:
```
Authorization: Bearer <token>
```
