# DevTask Hub — Progress Record

## Current phase
**Phase 3 — CLOSED 2026-10-23.** 3.1 ✅, 3.2 ✅ (all gates), 3.3 ✅ (assistant-verified: anon 401 / dev 403 / admin 200 + swagger.json securitySchemes).
**Phase 4 — CLOSED 2026-10-26.** (commits `13d139a`, `cd6a94e`, `06bd025`, `95de84e` on `day5-developing`). Verified: `npm run build` green, `npm run lint` green.
**Phase 5 — CLOSED 2026-10-26.** (commits `d91019f`, `33cadef` on `day5-developing`). Backend API build verified green (0 errors).
**Phase 6 — CLOSED 2026-10-27.** (commit `9bd8bc2`). Project Management UI (list, details, team members, modals, UI primitives).
**Phase 7 — CLOSED 2026-10-27.** (commit `8776f9b`). Task Management Backend API (CRUD, status state machine, project-member assignee guard, activity audit logs).
**Phase 8 — CLOSED 2026-10-27.** (commits `b7e32a9`, `5f54a1e`). Task Management Frontend UI.
**Phase 9 — CLOSED 2026-10-28.** (commits `d7a6162`, `8ba9304`). Dashboards & Performance (Admin & Dev stats, code splitting, request cancellation).
**Phase 10 — CLOSED 2026-10-28.** (commits `682e893`, `1c240e0`). GitHub Integration (Backend GitHub client with `IHttpClientFactory`, user profile link/unlink, Task $\leftrightarrow$ PR link, live status extraction [`Open`, `Merged`, `Closed`], 15-minute caching, frontend PR linking widget, live sync trigger, and Profile settings screen).
**Phase 11 — CLOSED 2026-10-28.** ASP.NET Core MVC Review (ADR documented in `docs/MVC_REVIEW.md`; decoupled API + React SPA confirmed; server-side DataAnnotations & ModelBinding validated).
**Phase 12 — IN PROGRESS (Testing, Security & Finalization).**
- Subphase 12.1: Azure Key Vault refactor / document user-secrets strategy.
- Subphase 12.2: Backend unit & integration tests (`xUnit`, `WebApplicationFactory`).
- Subphase 12.3: Final code review & smoke test.
- Subphase 12.4: Frontend component / workflow tests (`Vitest` + RTL).
- Subphase 12.5: Security review & NuGet advisory check.
- Subphase 12.6: Structured logging and error handling review.
- Subphase 12.7: Production config, deployment guidance, and final root `README.md`.

## Completed work
- Phase 0: workspace inspection; stack decided (net10.0, SQL Server 2025 Express, Node 24); all planning docs written.
- Refresh-token strategy approved (rotation, hashed storage, httpOnly cookie, reuse detection).
- Structure revised to a **single Web API project** with folder-based layering (user decision); docs updated accordingly.
- Phase 1.1: git repo + `backend/DevTaskHub.slnx` + `DevTaskHub.Api` project exist on disk.
- Phase 1.2: `frontend/` React + TS + Vite scaffold exists.
- Phase 1.4: root `README.md` created.
- Phase 2: Domain entities (8 entities + 7 enums) and EF Core DbContext with migrations applied (`2_InitialSchema`, `5_DeleteSeedAdminRow`).
- Phase 3: Backend Auth (register, login, refresh rotation, reuse detection, logout, /me, secure admin seed, Swagger Bearer auth).
- Phase 4: Frontend App shell, Axios client + silent refresh, AuthContext, real Login & Register forms, ProtectedRoute & RequireRole guards, role-filtered nav, ErrorBoundary.
- Phase 5: Complete Project Management API (Exception middleware, Project DTOs, Service, Controller with CRUD, members, filters, pagination).
- Phase 6: Complete Project Management UI (Projects list, Project Details, team member management, edit/delete modals, UI primitives).
- Phase 7: Complete Task Management API (CRUD, status transition state machine, project membership validation, automated audit logging, filters, pagination).
- Phase 8: Complete Task Management UI (Tasks list, multi-filter query bar, Task Details with state machine transitions, project-member assignee selector, and activity audit timeline).
- Phase 9: Dashboards & Performance (Admin & Dev stats, role-tailored dashboard views, code-splitting chunks with `React.lazy`, and request cancellation).
- Phase 10: Complete GitHub Integration (Backend GitHub client with `IHttpClientFactory`, user profile link/unlink, Task $\leftrightarrow$ PR link, live status extraction [`Open`, `Merged`, `Closed`], 15-minute caching, frontend PR linking widget, live sync trigger, and Profile settings screen).
- Phase 11: ASP.NET Core MVC Review (ADR documented in `docs/MVC_REVIEW.md`; decoupled API + React SPA confirmed; server-side DataAnnotations & ModelBinding validated).

## Known issues / open items
- Transitive `System.Security.Cryptography.Pkcs 9.0.11` NuGet advisory deferred to Phase 12.

## Git state
- Branch: **`day6-developing`**
- Canonical repo: `D:\Assignment\DevTask-Hub`.

## Next permitted action
Execute Phase 12 (Testing, security & finalization):
1. Create and run backend unit & integration tests (`backend/tests/DevTaskHub.Tests`).
2. Add frontend unit/component tests (`Vitest` + React Testing Library).
3. Conduct security review, NuGet audit, and deployment/README documentation.
