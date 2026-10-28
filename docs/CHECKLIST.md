# DevTask Hub — Progress Checklist

> Living tracking document. Updated by the assistant after each verification round.
> Legend: ✅ done & verified · 🔶 issued/in progress · ⚠️ issued but unverified · ⬜ not started

---

## Phase 0 — Workspace inspection & planning ✅
- [x] Tooling inspection (.NET 10.0.401, Node 24, npm 11, Git 2.55, SQL Server 2025 Express, dotnet-ef 10)
- [x] docs/PROJECT_PLAN.md
- [x] docs/ARCHITECTURE.md
- [x] docs/DATABASE_DESIGN.md
- [x] docs/API_CONTRACTS.md
- [x] docs/UI_PLAN.md
- [x] docs/SECURITY.md
- [x] docs/PROGRESS.md
- [x] Decisions: single Web API project, TaskItem naming, string enums, refresh-token rotation, users deactivate (never hard delete)

## Phase 1 — Backend & frontend foundation ✅
- [x] 1.1 git repo + `backend/DevTaskHub.slnx` + `DevTaskHub.Api` (single project, folder layering)
- [x] 1.2 React + TS + Vite in `frontend/`
- [ ] 1.3 backend `/weatherforecast` + frontend `:5173` runtime check — ⚠️ never reported by user
- [x] 1.4 root README.md + Phase 1 commit

## Phase 2 — SQL Server & EF Core ✅
- [x] 2.1 Domain: 8 entities + 7 enums (`Domain/`) — build 0/0 verified
- [x] 2.2 `Data/AppDbContext.cs`: table maps, string-enum conversions, unique constraints, indexes, delete behaviors — build 0/0 verified
- [x] 2.3 Migration `2_InitialSchema` applied → `DevTaskHubDb` has 9 tables (sqlcmd-verified); FK `TaskActivityLogs→Projects` revised to NoAction (SQL multiple-cascade-path)

## Phase 3 — Authentication & authorization ✅ (closed 2026-10-23)
- [x] 3.1 Register/login + PBKDF2 hashing (`PasswordHasher`) + DTO validation — verified: real `AQAAAA...` hashes in DB
- [x] 3.2 JWT + refresh rotation + `/me` + secure admin seed — ✅ **verified 2026-10-23 (all 4 gates + reuse-detection passed against live API)**
- [x] 3.3 Swagger "Authorize" button + role-gated endpoint demo — ✅ **verified by assistant 2026-10-23**

## Phase 4 — Frontend foundation & authentication ✅ (closed 2026-10-26)
- [x] App layout + sidebar/topbar nav — ✅ **4.1 verified 2026-10-23**
- [x] Axios client with bearer header + 401 interceptor — ✅ **4.2 verified 2026-10-23**
- [x] Auth context (access token in memory, `/me` hydration, logout) — ✅ **verified**
- [x] Login & register forms (field validation, preserve input on error) — ✅ **4.3 verified 2026-10-26:** commit `95de84e` on `day5-developing`
- [x] Protected routes + role-aware nav + 401/403 pages — ✅ **4.3 verified 2026-10-26:** `ProtectedRoute`, `RequireRole`, role-filtered nav in Layout.tsx
- [x] Error boundary + API try/catch patterns (assignment Day-6 #19) — ✅ **4.3 verified 2026-10-26:** `ErrorBoundary` class component

## Phase 5 — Project management API ✅ (closed 2026-10-26, commit `33cadef`)
- [x] 5.1 Global exception middleware + structured logging (`ExceptionHandlingMiddleware`)
- [x] 5.2 Project & Pagination DTOs + validation (`CommonDtos.cs`, `ProjectDtos.cs`)
- [x] 5.3 CRUD service + endpoints (creator rights, delete rules) (`IProjectService`, `ProjectService`, `ProjectsController`)
- [x] 5.4 Member add/remove with unique-constraint handling
- [x] 5.5 Server-side filter/pagination (`search`, `status`, `mine`)
- [x] 5.6 Verification pass & git commit (`33cadef`)

## Phase 6 — Project management UI ✅ (closed 2026-10-27, commit `9bd8bc2`)
- [x] 6.1 Project API client (`src/api/projects.ts`, `src/api/users.ts`)
- [x] 6.2 Reusable components (`Badge`, `Modal`, `Pagination`) — assignment Day-5 #15
- [x] 6.3 Projects list page (search, filters, pagination, loading/empty states, Create modal) — assignment Day-5 #16
- [x] 6.4 Project details page & member management UI (`src/pages/ProjectDetails.tsx`)

## Phase 7 — Task management API ✅ (closed 2026-10-27, commit `8776f9b`)
- [x] 7.1 Task DTOs + validation (`TaskDtos.cs`)
- [x] 7.2 CRUD + assignment rules (assignee must be project member)
- [x] 7.3 Status transitions state machine (ToDo→InProgress→InReview→Done, reopen rules) + `CompletedAtUtc`
- [x] 7.4 Filter/sort/search/pagination (`projectId`, `assigneeId`, `status`, `priority`, `mine`)
- [x] 7.5 Automated activity logging on every mutation (`TaskActivityLog`)

## Phase 8 — Task management UI ✅ (closed 2026-10-27, commits `b7e32a9`, `5f54a1e`)
- [x] 8.1 Task API client (`src/api/tasks.ts`)
- [x] 8.2 Task list with filters/sort/pagination (`src/pages/Tasks.tsx`)
- [x] 8.3 Task creation modal with project & member selectors
- [x] 8.4 Task details page + status transition controls + activity timeline (`src/pages/TaskDetails.tsx`)

## Phase 9 — Dashboards & performance ✅ (closed 2026-10-28)
- [x] 9.1 `/api/dashboard/admin` and `/api/dashboard/developer` stats (real SQL aggregates)
- [x] 9.2 Admin & developer dashboard screens in React (`src/pages/Dashboard.tsx`)
- [x] 9.3 Route lazy loading, code splitting, memoization pass, responsive check (`React.lazy` + `Suspense`)
- [x] 9.4 Request cancellation (`AbortController` signal in API methods) (assignment Day-8 #24)

## Phase 10 — GitHub integration ✅ (closed 2026-10-28)
- [x] 10.1 `GitHub/` client: public profile lookup, rate-limit/ETag handling (`GitHubService.cs`, `IHttpClientFactory`)
- [x] 10.2 Link/unlink GitHub profile (`GitHubAccounts`)
- [x] 10.3 Task ↔ PR linking (unique owner/repo/number)
- [x] 10.4 PR status sync: `GitHubState` vs `ReviewStatus` distinction, `LastSyncedAtUtc`, `SyncError`
- [x] 10.5 UI: integration badges + last-sync display (`src/api/github.ts`, `TaskDetails.tsx`, `Profile.tsx`)

## Phase 11 — ASP.NET Core MVC review ✅ (closed 2026-10-28, see docs/MVC_REVIEW.md)
- [x] 11.1 Decide if any server-rendered page is justified (evaluated & documented no-op)
- [x] 11.2 Razor forms, data binding & server-side validation (assignment Day-1 #1–2) — documented API-only deviation; DataAnnotations & Model Binding verified

## Phase 12 — Testing, security & finalization 🔶 CURRENT
- [ ] 12.1 Azure Key Vault refactor (assignment Day-4 #11): Jwt:Key + connection string via Azure.Identity — needs Azure subscription; stays user-secrets + documented if unavailable
- [ ] 12.2 Backend unit + integration tests (xUnit, `WebApplicationFactory`)
- [ ] 12.3 Final code review & smoke test (assignment Day-4 #13 + Day-8 #25: React → API → EF → SQL → GitHub)
- [ ] 12.4 Frontend component/workflow tests (Vitest + RTL)
- [ ] 12.5 Security review (incl. `System.Security.Cryptography.Pkcs` NuGet advisory follow-up)
- [ ] 12.6 Error handling + structured logging review
- [ ] 12.7 Production config, deployment guidance, final README/architecture docs

---

## Standing cautions
- Stop the API before `dotnet build`/`dotnet ef` (running exe locks the build)
- Canonical repo: `D:\Assignment\DevTask-Hub`, current branch: `day6-developing`
