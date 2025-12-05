# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

This repo contains a full-stack exam management platform with:
- A **Node.js/Express backend** (`backend/`) exposing REST APIs for authentication, user and student management, exam/question/result workflows, groups, bulk operations, and monitoring.
- A **React + Redux frontend** (`frontend/`) created with Create React App that provides separate student and admin interfaces, backed by the API.

The backend uses MongoDB via Mongoose and JWT-based auth. In production it can also serve the compiled frontend bundle.

---

## Commands and workflows

### Backend (API)

From `backend/`:

- Install dependencies:
  - `npm install`
- Run the API in development with auto-reload (via `nodemon`):
  - `npm run dev`
- Run the API in production mode (no auto-reload):
  - `npm start`
- Seed an initial admin user (see `src/seeder.js` for details):
  - `npm run seed:admin`
  - Creates a `Super Admin` user with email `admin@exampro.com` and password `admin123` in MongoDB (change the password after first login).

Tests:
- There is a `npm test` script, but it is currently a placeholder that exits with an error. No backend test suite is configured yet.

Environment variables used by the backend (see `server.js`, `src/config/db.js`, `src/utils/generateToken.js`):
- `MONGO_URI` – MongoDB connection string.
- `JWT_SECRET` – secret used to sign and verify JWTs.
- `PORT` – port for the Express server (defaults to `5000`).
- `NODE_ENV` – standard Node environment (e.g. `development` / `production`).
- `FRONTEND_ORIGIN` – optional CORS allowed origin for the frontend. If unset, CORS falls back to `*`.

### Frontend (React app)

From `frontend/`:

- Install dependencies:
  - `npm install`
- Start the development server (Create React App, defaults to `http://localhost:3000`):
  - `npm start`
- Run the test runner (Jest via `react-scripts test`):
  - `npm test`
  - When the watcher UI starts, select or filter by filename/test name to run a single test.
- Build the production bundle:
  - `npm run build`

Additional frontend config:
- `frontend/package.json` defines a proxy:
  - `"proxy": "http://localhost:5000"`
  This allows the CRA dev server to transparently proxy API calls to the backend when both are running locally.
- `frontend/src/config/api.js` and `frontend/src/index.js` set `axios` base URLs based on:
  - `REACT_APP_API_URL` (preferred, for custom deployments).
  - `NODE_ENV` (defaults to a deployed Render URL in production, or same-origin in development).

### Running the full stack locally

1. In `backend/`:
   - Ensure MongoDB is available and set `MONGO_URI` and `JWT_SECRET` (and optionally `PORT`, `FRONTEND_ORIGIN`).
   - Run `npm install` once, then `npm run dev`.
2. In `frontend/` (separate terminal):
   - Run `npm install` once, then `npm start`.
3. During local development, the frontend dev server uses the proxy to reach `http://localhost:5000` for API calls.

### Deployment (Render)

- Root-level `render.yaml` defines a single Render web service:
  - `buildCommand` installs backend and frontend dependencies and runs `npm --prefix frontend run build` to produce the React build.
  - `startCommand` is `cd backend` followed by `node server.js`, matching the `npm start` behavior but driven by Render.
  - `healthCheckPath` is `/api/health`, wired to the Express health endpoint in `server.js`.
  - Environment variables include `NODE_ENV=production`, `NODE_VERSION=20`, `REACT_APP_API_URL=https://exampro-ysox.onrender.com`, plus `MONGO_URI` and `JWT_SECRET` supplied via Render.
- `render-build.sh` mirrors the Render build steps (`npm --prefix backend ci/install`, `npm --prefix frontend ci/install`, `npm --prefix frontend run build`) and can be used locally or in other CI environments.
- `frontend/netlify.toml` supports deploying the built React app as a static site on Netlify:
  - Uses `npm run build` as the build command with `publish = "build"`.
  - Redirects all paths (`/*`) to `/index.html` so the SPA handles routing.

---

## Backend architecture (Express + MongoDB)

### High-level structure

Key backend entrypoints and directories:
- `backend/server.js` – main Express app:
  - Loads environment variables via `dotenv`.
  - Connects to MongoDB via `connectDB()` from `src/config/db.js`.
  - Configures CORS using `FRONTEND_ORIGIN` (or `*` if unset).
  - Sets up JSON body parsing.
  - Exposes a health check endpoint `GET /api/health` and a simple root `GET /`.
  - Mounts feature routers under the `/api/*` namespace.
  - In `NODE_ENV === 'production'`, serves the compiled React app from `../frontend/build` and falls back to `index.html` for non-API routes.

- `backend/src/config/db.js` – MongoDB connection logic:
  - Reads `MONGO_URI` and attempts reconnection several times before giving up, logging failures but keeping the process alive so health checks don’t immediately fail.

- `backend/src/middlewares/authMiddleware.js` – authentication/authorization:
  - `protect`:
    - Extracts the `Bearer` token from the `Authorization` header.
    - Verifies it using `JWT_SECRET`.
    - Looks up a `User` or `Student` document by `decoded.id` and attaches it as `req.user`, stripping passwords.
  - `admin`:
    - Ensures `req.user.role` is either `Super Admin` or `Moderator`.

- `backend/src/utils/generateToken.js` – JWT issuance:
  - Signs `{ id }` with `JWT_SECRET` and `expiresIn: '30d'`.

### Routing → controllers → models pattern

The backend generally follows a conventional Express layering:
- **Routes** under `backend/src/routes/` define URL structure, HTTP methods, and middleware composition.
- **Controllers** under `backend/src/controllers/` encapsulate request handling logic.
- **Models** under `backend/src/models/` define Mongoose schemas and database interaction.

Example: **exams**
- `src/routes/examRoutes.js`:
  - Uses `protect` and `admin` middlewares to gate access.
  - Student-specific endpoint: `GET /api/exams/available` (protected) to list exams a student can currently take.
  - Admin endpoints for CRUD:
    - `POST /api/exams` – create exam (admin only).
    - `GET /api/exams` – list exams (protected; same controller for students and admins, with questions omitted from the list view).
    - `GET /api/exams/:id` – get exam details (protected; behavior differs for students vs admins).
    - `PUT /api/exams/:id` – update exam (admin only).
    - `DELETE /api/exams/:id` – delete exam (admin only).

- `src/controllers/examController.js`:
  - `getExams` – returns all exams for both students and admins but omits question content in list views; time/status/group restrictions are handled via `getAvailableExams` and, in some cases, client-side logic.
  - `getExamById` – returns a reduced view for students (no full question detail) and full details for admins, with role-based access checks.
  - `createExam` – creates an exam by sampling questions from the question bank:
    - Uses `Question.aggregate` with `$match` on `subject` and `$sample` for random selection.
    - Validates that enough questions exist for the requested `questionCount`.
    - Persists metadata including timing, marking scheme, randomization flag, `assignedGroups`, and `createdBy`.
  - `updateExam` – merges `req.body` into an existing exam and saves.
  - `deleteExam` – deletes an exam by ID.
  - `getAvailableExams` – for the current `Student`, returns only exams:
    - With `status: 'Published'`.
    - Whose `startTime`/`endTime` window includes `now`.
    - Where `assignedGroups` is empty (public) **or** contains at least one of the student’s groups.

- `src/models/examModel.js`:
  - Defines the schema for exams, including:
    - Basic metadata: `title`, `description`, `subject`.
    - Scheduling and duration: `duration`, `startTime`, `endTime`.
    - Relations: `questions` (refs `Question`), `assignedGroups` (refs `Group`), `createdBy` (ref `User`).
    - Embedded `markingScheme` with `correct` and `incorrect` scores.
    - `status` enum: `'Draft' | 'Published' | 'Archived'`.
    - Timestamps enabled.

Other feature areas (auth, users, groups, bulk upload, monitoring, results, products) follow similar patterns:
- Each has a route file under `src/routes/` (e.g. `authRoutes.js`, `userRoutes.js`, `groupRoutes.js`, `bulkRoutes.js`, `monitorRoutes.js`, `resultRoutes.js`, `productRoutes.js`, `questionRoutes.js`).
- Controllers implement the actual logic (e.g. CRUD, dashboard/monitoring, file uploads, result calculation).
- Models represent core domain entities (`User`, `Student`, `Question`, `Result`, `Group`, etc.).

### Roles, students, and groups

- `User` documents represent all authenticated principals and carry a `role` field (`'Student' | 'Moderator' | 'Super Admin'`), along with `groups` and `subjects` arrays used for access control and filtering.
- A separate `Student` model mirrors much of the user shape but is locked to the `'Student'` role; both models share password hashing and `matchPassword` helpers.
- `Group` documents define named cohorts with `members` and a `createdBy` admin, and are linked from both users/students and exams (`assignedGroups`) to control which learners see which exams.

### Exam sessions, results, and analytics

- Result lifecycle is managed in `src/controllers/resultController.js` and `src/models/resultModel.js`:
  - `startExam` creates or resumes an exam "session" (`Result` document) per user+exam, precomputing a per-question `optionOrder` array and (optionally) shuffling questions when `exam.randomizeQuestions` is enabled.
  - When resuming an in-progress result, questions and options are reconstructed using the stored ordering so students see a consistent randomized view.
  - `submitExam` maps the student's selected display index back to the original option index using `optionOrder`, computes a score, and marks the result as `Completed`.
- Administrative endpoints expose reporting:
  - Per-exam result listings and CSV export with basic fields plus anti-cheating metrics such as `tabSwitchCount` and `copyPasteAttempts`.
  - Simple exam-level analytics (count, average, min, max scores) and per-student "my results" views that hide raw answer details.

### Seeding and bulk operations

- `src/seeder.js` – used by the `npm run seed:admin` script to seed initial admin user data (and potentially other initial entities).
- `src/controllers/bulkController.js` and `src/routes/bulkRoutes.js` – support bulk operations (e.g. processing uploads, likely using `multer` and `xlsx` based on dependencies).

### Monitoring and anti-cheating

- `src/routes/monitorRoutes.js` and `src/controllers/monitorController.js` are dedicated to monitoring/exam proctoring endpoints.
- These endpoints are protected and typically admin-only, enabling admins to monitor exam sessions (exact behavior defined in the controller).

---

## Frontend architecture (React + Redux Toolkit)

### High-level structure

Key entrypoints and directories:
- `frontend/src/index.js`:
  - Creates the React root and wraps the app with the Redux `Provider` using `store` from `src/store/index.js`.
  - Imports Bootstrap styles and custom `index.css`.
  - Configures global `axios.defaults.baseURL` to match the backend URL logic from `config/api.js`.

- `frontend/src/App.js`:
  - Uses `react-router-dom` with `HashRouter` to define all routes, which keeps client-side routing working even on static hosts or without custom server route configuration.
  - Splits routing into:
    - Public routes: `/`, `/login`, `/register`, `/exam/:id`.
    - Protected student routes under a `PrivateRoute` wrapper: `/dashboard`, `/profile`, `/exam/:id/take`, `/results/:id`.
    - Admin routes under an `AdminRoute` wrapper and `AdminLayout` container: `/admin`, `/admin/userlist`, `/admin/grouplist`, `/admin/examlist`, `/admin/questionlist`, monitoring, bulk upload, and edit/create routes.
  - Uses `PageTransition` to animate route changes and conditionally hides the main `Header` on admin paths.

- `frontend/src/store/index.js`:
  - Configures the Redux store with slices:
    - `user` – auth and user-related state.
    - `group` – group management state.
    - `exam` – exam listing, details, and availability.
    - `question` – question bank state.

- `frontend/src/store/slices/*.js`:
  - Each slice file defines async thunks (via `createAsyncThunk`) and reducers for its feature area.
  - Example: `examSlice.js`:
    - Thunks:
      - `listExams` – fetches all exams for admins (`GET /api/exams`).
      - `listAvailableExams` – fetches exams available to the current student (`GET /api/exams/available`).
      - `getExamDetails` – fetches details for a single exam (`GET /api/exams/:id`), using the logged-in user’s JWT.
    - Maintains `exams`, `exam`, `loading`, and `error` state.

- `frontend/src/components/`:
  - Reusable UI and layout components, including:
    - `Header`, `Footer` – global layout.
    - `PrivateRoute`, `AdminRoute` – route guards that check auth/role state from Redux and either render nested routes or redirect.
    - `AdminLayout` – wraps admin routes with admin-specific layout and sidebar.
    - `Loader`, `Message`, `PageTransition`, `Timer`, `FormContainer`, `AdminSidebar`, `UserCreateModal`, etc. for UX and flow.

- `frontend/src/screens/`:
  - Page-level components organized by feature and role, e.g.:
    - Student-facing: `HomeScreen`, `LoginScreen`, `RegisterScreen`, `ProfileScreen`, `StudentDashboardScreen`, `ExamDetailsScreen`, `ExamTakeScreen`, `ResultScreen`, group list/edit screens.
    - Admin-facing (in `screens/admin/`): `AdminDashboardScreen`, `UserListScreen`, `UserEditScreen`, `GroupListScreen`, `GroupEditScreen`, `ExamListScreen`, `ExamEditScreen`, `QuestionListScreen`, `QuestionEditScreen`, `MonitoringScreen`, `BulkUploadScreen`.
  - These screens orchestrate data fetching via Redux thunks, render tables/forms, and handle navigation.

- `frontend/src/services/`:
  - E.g. `questionService.js` – encapsulates API calls related to questions using `axios` and `API_BASE_URL`.

- `frontend/src/config/api.js`:
  - Centralizes the API base URL logic, shared with the Redux thunks and services.

### Data flow

A typical data flow for a feature (e.g. exams) looks like:
1. A screen component (e.g. `ExamListScreen` or `StudentDashboardScreen`) dispatches a thunk from the relevant slice (`examSlice`).
2. The thunk reads the current `user.userInfo` from Redux to obtain the JWT token.
3. It calls the backend API using `axios` and `API_BASE_URL`, attaching `Authorization: Bearer <token>` headers.
4. The response is stored in Redux state (`exams`, `exam`, etc.).
5. Components subscribe to the slice state using `useSelector` and render loading/error/data states accordingly.

Auth and role-based routing integrate closely with this pattern:
- Login flows store user info (including `token` and role) in the `user` slice.
- `PrivateRoute` and `AdminRoute` examine this state to decide whether to render nested routes or redirect to the login page.
- Backend middlewares (`protect`, `admin`) enforce the same constraints server-side, ensuring consistency between frontend navigation and API authorization.
