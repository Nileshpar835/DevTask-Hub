# DevTask Hub — Project Plan

## Identity
Full-stack developer task & issue tracking system for small software teams.
Modular monolith, enterprise-style UI, structured as a learning project:
every phase is small, explained, and verified before moving on.

## Environment (inspected 2026-10-20)
- .NET SDK 10.0.401 (net10.0, LTS), dotnet-ef 10.0.11 (global)
- Node 24.20.0, npm 11.19.0 (vite 8.x, react 19.x available)
- Git 2.55.0, SQL Server 2025 Express @ localhost\SQLEXPRESS (verified)
- Workspace D:\DevTaskHub is empty; git not yet initialized

## Stack
Backend: ASP.NET Core Web API (net10.0), EF Core + SQL Server, JWT +
refresh-token rotation, service layer, DTOs, Problem Details errors,
Swashbuckle, structured logging via built-in ILogger.
Frontend: React 19 + TypeScript + Vite, React Router v6, Axios,
Context API for auth state, server-side pagination.

## Structure (updated 2026-10-20 — user chose a single Web API project)
```
DevTaskHub/
  backend/
    DevTaskHub.sln
    DevTaskHub.Api/          (single project: Controllers/, Domain/, Dtos/, Services/, Data/, GitHub/, Middleware/)
    tests/                   (added Phase 5)
  frontend/
  docs/
  README.md  .gitignore
```
Conceptual layering is preserved via folders (see ARCHITECTURE.md). Trade-off: boundaries are conventions, not compiler-enforced references.

## Decisions summary
1. Target net10.0 (installed SDK, LTS).
2. Single Web API project with folder-based layering (user decision; replaces 4-project split).
3. Custom Users table + PasswordHasher&lt;T&gt; instead of full ASP.NET Identity.
4. Two roles as a string column (Admin/Developer); enforced by authorization policies in code.
5. Refresh tokens APPROVED: rotation, hashed storage in RefreshTokens table, httpOnly cookie; access token 15 min; refresh token 14 days; reuse detection revokes the token family.
6. Enums persisted as strings with CHECK constraints.
7. Users deactivated (IsActive=false), never hard-deleted.
8. No Docker/Redis/message broker — modular monolith.
9. GitHub: public profile/PR retrieval only; no stored PATs in phase 10.

## Phase checklist (`next` = advance ONE subphase)
- Phase 0: DONE — inspection + planning docs
- Phase 1: 1.1 git init + solution/projects · 1.2 React+Vite+TS · 1.3 run both · 1.4 commit
- Phase 2: 2.1 entities+DbContext · 2.2 relationships/constraints/indexes · 2.3 migration+apply+verify
- Phase 3: 3.1 register/login+hashing · 3.2 JWT+refresh+me+roles+admin provisioning · 3.3 Swagger test
- Phase 4: 4.1 layout/nav · 4.2 API client+auth context+refresh · 4.3 forms+protected routes
- Phase 5: 5.1 DTOs+validation · 5.2 CRUD · 5.3 members · 5.4 filter/paging/authz/tests
- Phase 6: 6.1 list · 6.2 details · 6.3 create/edit · 6.4 members UI
- Phase 7: 7.1 DTOs · 7.2 CRUD+assignment · 7.3 transitions · 7.4 query/filter · 7.5 activity+tests
- Phase 8: 8.1 list+filters · 8.2 details+activity · 8.3 forms · 8.4 status/assign
- Phase 9: 9.1 stats API · 9.2 admin dashboard · 9.3 dev dashboard · 9.4 perf/lazy/responsive
- Phase 10: 10.1 GitHub client · 10.2 profile · 10.3 PR link+sync · 10.4 UI
- Phase 11: MVC review (may be a documented no-op)
- Phase 12: tests, security review, README, deployment notes

## Testing strategy
- Every API subphase: `dotnet build` + Swagger manual check
- Phase 5+: xUnit integration tests (WebApplicationFactory)
- Phase 12: Vitest + React Testing Library; security review; e2e where practical
- Never claim a feature works without running the listed commands

## Assumptions & risks
- SQL instance name/connection kept in user-secrets only
- GitHub anonymous rate limit 60 req/h → cache + ETag + backoff
- Users deactivated, not deleted (data retention)
- No Docker/Redis/message broker unless a later phase proves need

## Division of labor
- Markdown/planning docs: created and edited by the assistant (AI).
- Code files (backend, frontend, configs): typed by hand by the user from the assistant's step-by-step instructions.
