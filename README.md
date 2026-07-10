# Bright Horizon School — Backend

A REST API for a school management system, built with Express and
MongoDB. It powers three roles — **admin**, **teacher**, and **student**
— each with different permissions over the same data.

**Live API**: https://school-management-backend-f88r.onrender.com
*(hosted on Render's free tier — the first request after a period of
inactivity can take 30–50 seconds while the server wakes up)*

**Frontend repo**: https://github.com/3laaouda-tech/school-management-frontend

---

## Tech stack

| Layer          | Technology              |
|-----------------|--------------------------|
| Runtime         | Node.js + Express        |
| Database        | MongoDB (via Mongoose)   |
| Auth            | JWT (JSON Web Tokens)    |
| Password hashing| bcryptjs                 |
| Hosting         | Render                   |

## Architecture

```
Client (React app)
      │  HTTP requests with Authorization: Bearer <token>
      ▼
Express server (server.js)
      │
      ├── middleware/auth.js   → verifies JWT, checks role permissions
      │
      ├── routes/
      │     ├── authRoutes.js       → POST /login
      │     ├── userRoutes.js       → users CRUD, self-profile, password change
      │     ├── classRoutes.js      → classes CRUD
      │     ├── gradeRoutes.js      → grades CRUD
      │     └── attendanceRoutes.js → attendance CRUD
      │
      └── models/ (Mongoose schemas)
            ├── User        (name, email, password, role, classId)
            ├── Class       (name, grade, teacherId)
            ├── Grade       (studentId, classId, subject, score, term)
            └── Attendance  (studentId, classId, date, status)
                    │
                    ▼
              MongoDB Atlas
```

## Data model

```
User ──teaches──▶ Class ◀──belongs_to── User (student)
 │                   │
 └──receives───▶ Grade ◀──has── Class
 │
 └──has───────▶ Attendance ◀──tracks── Class
```

- A **User** has a `role`: `admin`, `teacher`, or `student`.
- Students have a `classId` pointing to their Class. Teachers and
  admins don't.
- Every Grade and Attendance record is tied to both a student and a
  class.

## Roles & permissions

| Action                          | Admin | Teacher | Student |
|----------------------------------|:-----:|:-------:|:-------:|
| Log in                           | ✅    | ✅      | ✅      |
| View/change own profile & password | ✅  | ✅      | ✅      |
| Create/edit/delete users          | ✅    | ❌      | ❌      |
| Create/edit/delete classes        | ✅    | ❌      | ❌      |
| View all classes                  | ✅    | ✅      | ✅      |
| View students in a class          | ✅    | ✅      | ❌      |
| Add/edit/delete grades & attendance | ✅  | ✅      | ❌      |
| View grades & attendance           | all  | all     | own only |

Permissions are enforced in `middleware/auth.js` (`protect` verifies
the JWT, `allowRoles(...)` checks the role) and, for students, by
filtering query results to their own `id` inside each route.

## API reference

Base URL (local): `http://localhost:5000/api`
Base URL (production): `https://school-management-backend-f88r.onrender.com/api`

| Method | Route                     | Who            | Description |
|--------|---------------------------|----------------|--------------|
| POST   | `/auth/login`              | everyone       | Log in, returns a JWT |
| GET    | `/users/me`                | logged in      | Get own profile |
| PUT    | `/users/me/password`       | logged in      | Change own password |
| GET    | `/users`                   | admin          | List all users |
| POST   | `/users`                   | admin          | Create a user |
| PUT    | `/users/:id`                | admin          | Update a user |
| DELETE | `/users/:id`                | admin          | Delete a user |
| GET    | `/classes`                 | logged in      | List all classes |
| GET    | `/classes/:id/students`     | admin, teacher | List students in a class |
| POST   | `/classes`                 | admin          | Create a class |
| PUT    | `/classes/:id`               | admin          | Update a class |
| DELETE | `/classes/:id`               | admin          | Delete a class |
| GET    | `/grades`                  | logged in      | List grades (own only if student; `?classId=` to filter) |
| POST   | `/grades`                  | admin, teacher | Add a grade |
| PUT    | `/grades/:id`                | admin, teacher | Update a grade |
| DELETE | `/grades/:id`                | admin, teacher | Delete a grade |
| GET    | `/attendance`              | logged in      | List attendance (own only if student; `?classId=` to filter) |
| POST   | `/attendance`              | admin, teacher | Add an attendance record |
| PUT    | `/attendance/:id`            | admin, teacher | Update an attendance record |
| DELETE | `/attendance/:id`            | admin, teacher | Delete an attendance record |

Protected routes expect:
```
Authorization: Bearer <token>
```

## Local setup

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
   (or use a MongoDB Atlas connection string — see the note below)

3. Create the first admin account:
   ```
   node seed.js
   ```
   Creates `admin@school.com` / `admin123`.

4. *(Optional)* Fill the database with demo data — 6 teachers, 6
   classes, ~48 students, plus grades and attendance history:
   ```
   node seedDemoData.js
   ```
   All demo accounts share the password `password123`. Safe to
   re-run — it clears the previous demo batch first.

5. Run the server:
   ```
   npm run dev
   ```
   API runs at `http://localhost:5000`.

> **Note on MongoDB**: if `mongodb+srv://` connection strings fail
> with a `querySrv ECONNREFUSED` error, it's usually a local DNS
> issue — switching your network adapter's DNS to `8.8.8.8` /
> `8.8.4.4` resolves it in most cases.

## Deployment (Render)

This API is deployed on [Render](https://render.com) as a Web Service:

- **Build command**: `npm install`
- **Start command**: `node server.js`
- **Environment variables**: `MONGO_URI`, `JWT_SECRET`
  (`PORT` is provided automatically by Render)

Pushing to the `main` branch on GitHub triggers an automatic redeploy.

## Project structure

```
school-management-backend/
├── config/db.js              → MongoDB connection
├── middleware/auth.js        → JWT verification + role checks
├── models/                   → User, Class, Grade, Attendance
├── routes/                   → auth, users, classes, grades, attendance
├── server.js                 → app entry point
├── seed.js                   → creates the first admin account
└── seedDemoData.js           → generates demo teachers/students/data
```
