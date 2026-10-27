# DevTask Hub — Progress Record

## Current phase
**Phase 3 — CLOSED 2026-10-23.** 3.1 ✅, 3.2 ✅ (all gates), 3.3 ✅ (assistant-verified: anon 401 / dev 403 / admin 200 + swagger.json securitySchemes).
**Phase 4 — CLOSED 2026-10-26.** (commits `13d139a`, `cd6a94e`, `06bd025`, `95de84e` on `day5-developing`). Verified: `npm run build` green, `npm run lint` green.
**Phase 5 — CLOSED 2026-10-26.** (commits `d91019f`, `33cadef` on `day5-developing`). Backend API build verified green (0 errors).
**Phase 6 — CLOSED 2026-10-27.** (commit `9bd8bc2`). Project Management UI (list, details, team members, modals, UI primitives).
**Phase 7 — CLOSED 2026-10-27.** (commit `8776f9b`). Task Management Backend API:
- Subphase 7.1 ✅: Task DTOs & validation (`TaskDtos.cs`).
- Subphase 7.2 ✅: Task Service (`ITaskService`, `TaskService`) with transition state machine, member assignment guard, and automated activity logging.
- Subphase 7.3 ✅: `TasksController` endpoints (`GET /api/tasks`, `POST`, `GET /:id`, `PUT /:id`, `PATCH /:id/status`, `PATCH /:id/assignee`, `DELETE /:id`, `GET /:id/activity`).
- Subphase 7.4 ✅: Backend build verified green (0 errors).
**Phase 8 — IN PROGRESS (Task Management Frontend UI).**
- Subphase 8.1 ✅: Typed Task API client (`src/api/tasks.ts`).
- Subphase 8.2 ✅: Tasks list page (`src/pages/Tasks.tsx`) with search, project filter, status pills, priority badges, and pagination.
- Subphase 8.3 ✅: Task Create modal with dynamic project-member loading. Verified: `npm run build` green, `npm run lint` green (0 errors).
- Subphase 8.4 🔶 (NEXT): Task Details page (`src/pages/TaskDetails.tsx`) with status switcher dropdown (enforcing transition rules), assignee selector, and activity audit timeline.

## Completed work
- Phase 0: workspace inspection; stack decided (net10.0, SQL Server 2025 Express, Node 24); all planning docs written.
- Refresh-token strategy approved (rotation, hashed storage, httpOnly cookie, reuse detection).
- Structure revised to a **single Web API project** with folder-based layering (user decision); docs updated accordingly.
- Phase 1.1: git repo + `backend/DevTaskHub.slnx` + `DevTaskHub.Api` project exist on disk.
- Phase 1.2: `frontend/` React + TS + Vite scaffold exists.
- Phase 1.4: root `README.md` created.
- Phase 2: Domain entities (8 entities + 7 enums) and EF Core DbContext with migrations applied (`2_InitialSchema`, `5_DeleteSeedAdminRow`).
- Phase 3: Backend Auth (register, login, refresh rotation, reuse detection, logout, /me, secure admin seeder, Swagger Bearer auth).
- Phase 4: Frontend App shell, Axios client + silent refresh, AuthContext, real Login & Register forms, ProtectedRoute & RequireRole guards, role-filtered nav, ErrorBoundary.
- Phase 5: Complete Project Management API (Exception middleware, Project DTOs, Service, Controller with CRUD, members, filters, pagination).
- Phase 6: Complete Project Management UI (Projects list, Project Details, team member management, edit/delete modals, UI primitives).
- Phase 7: Complete Task Management API (CRUD, status transition state machine, project membership validation, automated audit logging, filters, pagination).
- Phase 8 (Part 1): Task API client, Tasks list page with multi-factor filters, and task creation modal.

## Known issues / open items
- Transitive `System.Security.Cryptography.Pkcs 9.0.11` NuGet advisory deferred to Phase 12.

## Git state
- Branch: **`day5-developing`**
- Canonical repo: `D:\Assignment\DevTask-Hub`.

## Next permitted action
Commit Phase 8 (Part 1), then implement Phase 8.4 (`TaskDetails.tsx` with activity timeline).
