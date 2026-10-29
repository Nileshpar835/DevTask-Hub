# DevTask Hub — Verification Log

**Date:** October 29, 2026  
**Auditor:** Senior Software Engineer & Technical Documentation Specialist  
**Project:** DevTask Hub  
**Student:** Parmar Nilesh Prakashkumar (Enrollment: 202206100110113)  
**Institute:** Babu Madhav Institute of Information Technology, Uka Tarsadia University  
**Branch / Commit:** `day6-developing` / Phase 11 complete, Phase 12 in progress  

---

## 1. Executive Build & Runtime Verification

| Component | Target / Runtime | Verification Method | Status | Notes |
|---|---|---|---|---|
| **Backend API** | .NET 10 (`net10.0`), ASP.NET Core | `dotnet build`, `dotnet run` | **SUCCESS** | Compiled with 0 errors. Listens on `http://localhost:5109`. Warning regarding transitive package advisory NU1903/NU1902 (`System.Security.Cryptography.Pkcs`). |
| **Frontend SPA** | React 19.3.1, Vite 8.3.4, TypeScript 6.0.3 | `npm run build`, `npm run dev` | **SUCCESS** | Built 104 modules into clean chunks in 1.09s. Dev server active on `http://localhost:5173`. |
| **Database** | SQL Server 2025 Express (`localhost\SQLEXPRESS`) | `dotnet ef database update` | **SUCCESS** | Database `DevTaskHubDb` contains all 5 applied migrations and 8 core tables with foreign keys and check constraints. |
| **Environment Secrets** | .NET User-Secrets (`a5fe7eb2-...`) | `dotnet user-secrets list` | **SUCCESS** | Contains `ConnectionStrings:DevTaskHub`, `Jwt:Key` (256-bit hex), `Seed:Admin:Email`, `Seed:Admin:Password`, `Seed:Admin:FullName`. |

---

## 2. Features Verified Working

### A. Authentication & Session Management
- **Registration**: `POST /api/auth/register` creates new user accounts with default `Developer` role, hashes passwords using ASP.NET Core `PasswordHasher<User>` (PBKDF2), and returns JWT.
- **Login**: `POST /api/auth/login` verifies credentials against stored hash, returns 15-minute HS256 JWT access token, and sets a 14-day cryptographic refresh token in an `httpOnly`, `SameSite=Lax` cookie.
- **Refresh Token Rotation & Reuse Detection**: `POST /api/auth/refresh` rotates refresh tokens on every call. Stored tokens are SHA-256 hashed. Attempted reuse of a revoked token triggers theft detection and invalidates all user tokens.
- **Session Restoration & Logout**: Frontend silently restores user sessions on page refresh via background refresh call. `POST /api/auth/logout` revokes tokens and clears cookies.
- **Admin Seeding**: `DbSeeder` seeds an initial Admin (`admin@devtaskhub.com`) at startup if no admin exists.

### B. Project Management
- **Project CRUD**: Admins can create projects with short uppercase keys (2–10 alphanumeric characters), edit name/description/status (Active, OnHold, Archived), and soft-delete/delete projects.
- **Access Boundary**: Non-admin developers can only query and view projects where they are registered team members or owners.
- **Team Membership**: Project owners and Admins can add active users as team members and remove members. Prevented removal of project owners.
- **Deletion Integrity**: Projects with active/incomplete tasks are protected from deletion.

### C. Task Management & State Machine
- **Kanban Board**: Drag-and-drop board with 4 workflow columns: *ToDo*, *InProgress*, *InReview*, *Done*. Supports optimistic UI updates.
- **List View**: Paginated table view (15 items/page) with full filter bar: text search, project dropdown, priority filter, category filter, assignee filter, and "Mine" quick-filter.
- **Workflow State Machine**: Strictly enforces business transitions:
  - `ToDo` $\rightarrow$ `InProgress`
  - `InProgress` $\rightarrow$ `InReview` or `ToDo`
  - `InReview` $\rightarrow$ `Done` or `InProgress`
  - `Done` $\rightarrow$ `InProgress` (Reopen permitted only to Admin or assigned developer)
  - All invalid transitions (e.g., `ToDo` directly to `Done`) are blocked.
- **Assignee Guard**: Enforces that assigned developers must already belong to the project team.
- **Dynamic Categories**: Pre-populated with `Feature`, `Bug`, `Update`, `Refactor`, `Documentation`, with ability to add custom categories on the fly.
- **Audit Logging**: Chronological history logs actor, action, old value, new value, and timestamp.

### D. Role-Aware Dashboards & Metrics
- **Admin Dashboard**: System-wide KPI cards (Total Projects, Total Tasks, Active Users, Overdue Tasks), status distribution breakdown with colored badges, and recent organization activity timeline.
- **Developer Dashboard**: Personal workload metrics (Total Assigned Tasks, status breakdown, Overdue Tasks table with red due-date alerts, Due in 7 Days table, and My Projects card grid).
- **Role Security**: Route guards (`RequireRole`) and controller attributes (`[Authorize(Roles = "Admin")]`) block non-admin users with HTTP 403 Forbidden.

### E. User Administration
- **User Directory**: Admin-only table displays all users, email, role badge, registration date, and active/inactive status toggle.
- **Soft Deactivation**: Disabling a user sets `IsActive = false`, immediately blocking login and task assignment. UI prevents admin self-deactivation.

### F. GitHub Integration
- **Profile Linking**: Integrates with GitHub REST API (`GET https://api.github.com/users/{username}`) to link public GitHub avatar, bio, and repository profile.
- **Pull Request Linking**: Links GitHub PR URLs (`https://github.com/{owner}/{repo}/pull/{number}`) to specific tasks using regex validation.
- **PR State Synchronization**: On-demand sync fetches live GitHub state (Open, Closed, Merged), Draft status, and review status.
- **Commit History**: Direct client-side fetch of commits from public GitHub API.

---

## 3. Discovered Issues & Incomplete Items

1. **Unregistered Exception Handling Middleware (Critical Architecture Flaw)**:
   - `ExceptionHandlingMiddleware` is implemented in `backend/DevTaskHub.Api/Middleware/ExceptionHandlingMiddleware.cs` to map exceptions to RFC 7807 Problem Details (400, 403, 404).
   - However, `app.UseMiddleware<ExceptionHandlingMiddleware>()` is **omitted from `Program.cs`**.
   - **Impact**: Any domain exception (such as illegal state transitions, duplicate project members, or invalid PR URLs) bubbles up as an unhandled HTTP 500 error instead of a user-friendly 400 Bad Request or 403 Forbidden.
2. **Activity Log Save in `CreateTaskAsync`**:
   - `TaskService.LogActivityAsync` calls `_db.TaskActivityLogs.Add()` but does not call `SaveChangesAsync()`.
   - In `CreateTaskAsync`, the log is added after the task is saved, and the method immediately calls `GetTaskByIdAsync` (which uses `AsNoTracking()`). As a result, the initial "Created" activity record is not committed to the database during task creation.
3. **Empty Test Suite**:
   - `backend/tests/DevTaskHub.Tests/UnitTest1.cs` contains only an empty template test `[Fact] public void Test1()`. Automated unit and integration tests from Phase 12 were not implemented prior to our test run.
4. **Sidebar Navigation Role-Aware Filtering**:
   - In `src/components/Layout.tsx`, the `/users` navigation item is visible to all logged-in users regardless of role, although accessing the route correctly redirects Developer users to `/403`.
5. **Minor UI String Formatting Bug**:
   - In `src/components/ui/Pagination.tsx` (line 19), `Page{page} of {totalpages}` lacks a space between "Page" and the page number, rendering as "Page1 of 2".

---

## 4. Items Not Verified / Out of Scope

- **Private GitHub Repositories**: The system design explicitly uses unauthenticated public GitHub REST API endpoints. Private repository token integration and webhooks are outside the project scope.
- **Email Delivery / SMTP**: System does not implement an SMTP server for email confirmation or password resets; authentication relies on direct credential verification.
- **Real-Time WebSockets**: Task board updates are not pushed via SignalR or WebSockets; state changes reflect upon HTTP action completion or page refresh.
