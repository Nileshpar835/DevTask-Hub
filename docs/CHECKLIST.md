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

## Phase 5 — Project management API 🔶 CURRENT
- [x] 5.1 Global exception middleware + structured logging (`ExceptionHandlingMiddleware`)
- [ ] 5.2 Project & Pagination DTOs + validation 🔶 IN PROGRESS
- [ ] 5.3 CRUD service + endpoints (creator rights, delete rules) 🔶 IN PROGRESS
- [ ] 5.4 Member add/remove with unique-constraint handling
- [ ] 5.5 Server-side filter/pagination (`search`, `status`, `mine`)
- [ ] 5.6 Authorization checks + xUnit integration tests (tests project created here)

## Phase 6 — Project management UI ⬜
- [ ] Reusable components (Button, Input, Card, Table, Badge, Modal…)
- [ ] Controlled inputs + useState events
- [ ] Project list (filters, pagination, loading/empty/error states)
- [ ] Project details + stats
- [ ] Create/edit forms
- [ ] Member management UI

---

## Standing cautions
- Stop the API before `dotnet build`/`dotnet ef` (running exe locks the build)
- Canonical repo: `D:\Assignment\DevTask-Hub`, branch `day5-developing`
