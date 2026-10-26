# DevTask Hub — Progress Record

## Current phase
**Phase 3 — CLOSED 2026-10-23.** 3.1 ✅, 3.2 ✅ (all gates), 3.3 ✅ (assistant-verified: anon 401 / dev 403 / admin 200 + swagger.json securitySchemes).
**Phase 4 — CLOSED 2026-10-26.** (commits `13d139a`, `cd6a94e`, `06bd025`, `95de84e` on `day5-developing`). Verified: `npm run build` green, `npm run lint` green.
**Phase 5 — CLOSED 2026-10-26.** (commits `d91019f`, `33cadef` on `day5-developing`). Backend API build verified green (0 errors):
- 5.1 ✅: `ExceptionHandlingMiddleware` + structured logging + uniform error JSON.
- 5.2 ✅: Project & Pagination DTOs (`CommonDtos.cs`, `ProjectDtos.cs`).
- 5.3 ✅: Project Service & Controller CRUD endpoints.
- 5.4 ✅: Team members management (add, remove, list).
- 5.5 ✅: Server-side filters (`mine`, `status`, `search`) and pagination (`page`, `pageSize`).
- 5.6 ✅: Build verified green and committed.
**Phase 6 — IN PROGRESS (Project Management UI).**
- Subphase 6.1 ✅: Typed Project API client (`src/api/projects.ts`).
- Subphase 6.2 ✅: Reusable UI components (`Badge`, `Modal`, `Pagination` in `src/components/ui/`).
- Subphase 6.3 ✅: Projects list page (`src/pages/Projects.tsx`) with search, filter pills, pagination, and Create Project modal. Verified: `npm run build` green, `npm run lint` green (0 errors).
- Subphase 6.4 🔶 (NEXT): Project Details page & team member management UI.

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
- Phase 6 (Part 1): Frontend Project API client, UI primitives (Badge, Modal, Pagination), and real Projects list page with filters and create modal.

## Known issues / open items
- Transitive `System.Security.Cryptography.Pkcs 9.0.11` NuGet advisory deferred to Phase 12.

## Git state
- Branch: **`day5-developing`**
- Canonical repo: `D:\Assignment\DevTask-Hub`.

## Next permitted action
Phase 6.4 — Project Details view & Member Management UI (`ProjectDetails.tsx`).
