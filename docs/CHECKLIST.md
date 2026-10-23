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
  - [x] JwtBearer package; `TokenService`; `DbSeeder`; auth pipeline in Program.cs (`UseAuthentication`→`UseAuthorization`)
  - [x] Refresh-token rotation logic + reuse detection in `AuthService`
  - [x] Cookie flags: HttpOnly, SameSite=Lax, Path=/api/auth
  - [x] DTO record validation attributes on constructor parameters (500 fixed)
  - [x] `Jwt` Issuer/Audience block in appsettings.json (token now carries `aud`)
  - [x] `SeedInitialAdmin` removed from AppDbContext "for real"; migration `5_DeleteSeedAdminRow` (`DeleteData`) applied — plaintext row deleted
  - [x] Fix C: `TokenService.cs` L40 `Jwr:Issuer` → `Jwt:Issuer` (token now carries `iss`)
  - [x] App restarted → `DbSeeder` created hashed admin (row Id=4, `AQAAAA...` hash)
  - [x] 4-gate retest PASSED: dev `/me` 200 · admin login 200/Role=Admin · no-token 401 + short-password 400 · login→refresh→logout→401 cycle · rotated-token replay → 401
- [x] 3.3 Swagger "Authorize" button + role-gated endpoint demo — ✅ **verified by assistant 2026-10-23:** `GET /api/users` anon → **401**, dev → **403**, admin → **200 (3 users)**; `/swagger/v1/swagger.json` contains `components.securitySchemes.Bearer` + global `security` requirement (Authorize button renders & injects header). Browser click-test left to user; 3.3 code landed in commit `ffd8575` (message says "fix(auth)" — content verified regardless).

## Phase 4 — Frontend foundation & authentication 🔶 CURRENT
- [x] App layout + sidebar/topbar nav — ✅ **4.1 verified 2026-10-23:** `npm run build` green (tsc+vite, 27 modules), commit `13d139a`; react-router-dom 7.18.4; eyeball pass (nav/404/hamburger) folded into 4.2 browser test
- [ ] Axios client with bearer header + 401 interceptor — **4.2 ISSUED 2026-10-23** (includes **CORS policy in Program.cs** — was missing; browser calls from :5173 need it)
- [ ] Auth context (access token in memory, `/me` hydration, logout)
- [ ] Login & register forms (field validation, preserve input on error)
- [ ] Protected routes + role-aware nav + 401/403 pages
- [ ] Error boundary + API try/catch patterns (assignment Day-6 #19)

## Phase 5 — Project management API ⬜
- [ ] Global exception middleware + structured logging (assignment Day-3 #8 — backend plumbing, before CRUD)
- [ ] Project DTOs + validation
- [ ] CRUD service + endpoints (creator rights, delete rules)
- [ ] Member add/remove with unique-constraint handling
- [ ] Server-side filter/pagination (`search`, `status`, `mine`)
- [ ] Authorization checks + xUnit integration tests (tests project created here)

## Phase 6 — Project management UI ⬜
- [ ] Reusable components (Button, Input, Card, Table, Badge, Modal…) — assignment Day-5 #15; built per UI_PLAN "when first needed", plain CSS variables (not CSS Modules — UI_PLAN deviation, user-approved)
- [ ] Controlled inputs + useState events (assignment Day-5 #16 — first real form is 6.3)
- [ ] Project list (filters, pagination, loading/empty/error states)
- [ ] Project details + stats
- [ ] Create/edit forms
- [ ] Member management UI

## Phase 7 — Task management API ⬜
- [ ] Task DTOs + validation
- [ ] CRUD + assignment rules (assignee must be project member)
- [ ] Status transitions (ToDo→InProgress→InReview→Done, reopen rules) + `CompletedAtUtc`
- [ ] Filter/sort/search/pagination
- [ ] Activity logging on every mutation + tests

## Phase 8 — Task management UI ⬜
- [ ] Task list with filters/sort/pagination
- [ ] Task details + activity timeline
- [ ] Create/edit forms
- [ ] Status/assignee controls reflecting transition rules

## Phase 9 — Dashboards & performance ⬜
- [ ] `/api/dashboard/admin` stats (real SQL aggregates)
- [ ] `/api/dashboard/developer` stats
- [ ] Admin + developer dashboard screens
- [ ] Route lazy loading, code splitting, memoization pass, responsive check
- [ ] Request cancellation (AbortController) + timeout/retry + loading states (assignment Day-8 #24)

## Phase 10 — GitHub integration ⬜
- [ ] `GitHub/` client: public profile lookup, rate-limit/ETag handling
- [ ] Link/unlink GitHub profile (GitHubAccounts)
- [ ] Task ↔ PR linking (unique owner/repo/number)
- [ ] PR status sync: `GitHubState` vs `ReviewStatus` distinction, `LastSyncedAtUtc`, `SyncError`
- [ ] UI: integration badges + last-sync display

## Phase 11 — ASP.NET Core MVC review ⬜
- [ ] Decide if any server-rendered page is justified (documented no-op allowed)
- [ ] Razor forms, data binding & server-side validation (assignment Day-1 #1–2) — implement if MVC route chosen, else document API-only deviation

## Phase 12 — Testing, security & finalization ⬜
- [ ] Azure Key Vault refactor (assignment Day-4 #11): Jwt:Key + connection string via Azure.Identity — needs Azure subscription; stays user-secrets + documented if unavailable
- [ ] Backend unit + integration tests
- [ ] Final code review & smoke test (assignment Day-4 #13 + Day-8 #25: React → API → EF → SQL → GitHub)
- [ ] Frontend component/workflow tests (Vitest + RTL)
- [ ] Security review (incl. `System.Security.Cryptography.Pkcs` NuGet advisory follow-up)
- [ ] Error handling + structured logging review
- [ ] Production config, deployment guidance, final README/architecture docs

---

## Current task (Phase 4.2 — Axios client + AuthContext)
1. Backend: `Program.cs` CORS policy `Frontend` (`WithOrigins("http://localhost:5173")` + `AllowCredentials()`) + `app.UseCors("Frontend")` before auth
2. `npm install axios` → new `src/api/client.ts` (bearer request interceptor, 401→single-flight refresh→retry response interceptor) + `src/context/AuthContext.tsx` (token in memory, boot via `/auth/refresh`+`/auth/me`, login/register/logout)
3. Wrap app in `AuthProvider` (App.tsx); Layout user chip shows real user + Sign out
4. Verify: `npm run build` green · CORS preflight headers · browser boot behavior · Swagger-cookie trick restores session
5. Then `next` → assistant verifies → Phase 4.3 (forms, protected routes, error boundary)

## Standing cautions
- Stop the API before `dotnet build`/`dotnet ef` (running exe locks the build) — past "failures" were MSB3021 file locks, not code errors
- Empty migration `Up()` = model unchanged vs DB = the intended edit didn't happen — don't apply, check code first
- Phase 1.3 runtime check never reported; re-run if anomalies appear
- NuGet advisory: transitive `System.Security.Cryptography.Pkcs 9.0.11` (deferred to Phase 12)
- Canonical repo: `D:\Assignment\DevTask-Hub`, branch `day1-developing`
