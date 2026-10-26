# DevTask Hub — Progress Record

## Current phase
**Phase 3 — CLOSED 2026-10-23.** 3.1 ✅, 3.2 ✅ (all gates), 3.3 ✅ (assistant-verified: anon 401 / dev 403 / admin 200 + swagger.json securitySchemes).
**Phase 4 — CLOSED 2026-10-26.** (commits `13d139a`, `cd6a94e`, `06bd025`, `95de84e` on `day5-developing`). Verified: `npm run build` green, `npm run lint` green.
**Phase 5 — IN PROGRESS (Backend Project Management API).**
- Subphase 5.1 ✅: `ExceptionHandlingMiddleware` created.
- Subphase 5.2 ✅: Project & Pagination DTOs created (`CommonDtos.cs`, `ProjectDtos.cs`).
- Subphase 5.3 ✅: `IProjectService` & `ProjectService` CRUD + membership rules.
- Subphase 5.4 ✅: Project Members endpoints (`GetMembers`, `AddMember`, `RemoveMember`).
- Subphase 5.5 ✅: Server-side search, status filter, `mine` filter, and pagination.
- Subphase 5.6 🔶 (NEXT): Verification / testing of Project endpoints; git commit for Phase 5.
**Phase 6 — UPCOMING:** Project Management UI (reusable components, project list with filters, details, create/edit modals, member management).

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
- Phase 5 (Backend): Exception middleware, Project DTOs, Project Service & Controller with CRUD, members, filters, pagination. Build verified green (0 errors).

## Known issues / open items
- Transitive `System.Security.Cryptography.Pkcs 9.0.11` NuGet advisory deferred to Phase 12.

## Git state
- Branch: **`day5-developing`**
- Canonical repo: `D:\Assignment\DevTask-Hub`.

## Next permitted action
Verify Project API endpoints (Swagger/curl), commit Phase 5 backend, then begin Phase 6 (Project UI).
