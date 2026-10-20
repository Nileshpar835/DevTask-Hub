# DevTask Hub — Architecture

**Structure decision (2026-10-20, user-approved):** a **single ASP.NET Core Web API project** (`DevTaskHub.Api`) with folders instead of 4 separate assemblies. Rationale: simpler navigation for a learning project. Trade-off: layer boundaries are convention-based (folders), not compiler-enforced.

## Project layout
```
backend/DevTaskHub.sln
backend/DevTaskHub.Api/
  Program.cs              ← composition root: DI, JWT, Swagger, middleware
  Controllers/            ← HTTP endpoints only; no business rules, no EF queries
  Domain/                 ← entities + enums (User, Task, TaskStatus, ...)
  Dtos/                   ← request/response models (never expose entities)
  Services/               ← business rules, validation, orchestration (+ interfaces)
  Data/                   ← AppDbContext, EF configurations, Migrations/, seeding
  GitHub/                 ← GitHub HTTP client (Phase 10 only)
  Middleware/              ← global exception handler, correlation id
```

**Folder rules (the "poor man's compiler"):**
- `Controllers/` may reference `Services/` and `Dtos/` — never `Data/` directly.
- `Domain/` references nothing from this app (no EF, no HTTP).
- `Services/` talk to the database only through `AppDbContext` or another service interface — GitHub calls only via `GitHub/`.
- Entities are never returned from a controller — only DTOs.

## Request flow
```
React (Axios, JWT in memory, refresh cookie)
  → Controller (authorize attribute, bind DTO)
  → Service (validation, business rules)
  → AppDbContext (SQL Server)
  → DTO back → Problem Details on error
```
Cross-cutting: global exception middleware, structured logging with a
request correlation id, CancellationToken passed through async calls.

## Authentication flow (refresh-token rotation)
1. Login/register → server creates access JWT (15 min) + refresh token (14 days).
2. Refresh token returned as `httpOnly; SameSite=Lax` cookie scoped to `/api/auth`;
   its SHA-256 hash is stored in `RefreshTokens` (raw token never persisted).
3. Access token returned in the JSON body and kept only in JS memory (no localStorage).
4. `/api/auth/refresh`: validate cookie → if token valid, revoke it, insert its
   successor (`ReplacedByTokenId`), issue new access + new cookie (rotation).
5. Reuse of an already-revoked token = theft signal → revoke the whole token family.
6. Logout: revoke presented refresh token + clear cookie.

## Key decisions
1. Modular monolith, single deployment unit.
2. Custom Users table + `PasswordHasher<T>` instead of full Identity (Identity's 6+ tables are unnecessary for 2 roles and 1 login flow).
3. Two roles as a string column; enforced by named authorization policies (`Admin`, per-resource `ProjectMember` checks in services) — hiding UI buttons is not security.
4. Repository pattern used only where it hides EF specifics from services; read-only query services may use DbContext projections directly (documented per use).
5. Enums persisted as strings with CHECK constraints (readable in SQL, no magic numbers).
6. UTC for every timestamp column; client converts to local time.
7. Dashboard statistics computed with indexed SQL queries — no cached counters until measured need.
8. GitHub integration isolated behind `IGitHubClient` in the `GitHub/` folder so task business logic in `Services/` never performs HTTP calls directly.

## Testing project (Phase 5+)
```
backend/tests/DevTaskHub.Tests/   → references DevTaskHub.Api (xUnit + WebApplicationFactory)
```
