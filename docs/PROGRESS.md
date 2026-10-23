# DevTask Hub — Progress Record

## Current phase
**Phase 3.2 — CLOSED (verified by assistant 2026-10-23, all 4 gates + refresh reuse-detection passed against live API :5109).**
**Phase 3.3 — INSTRUCTIONS ISSUED 2026-10-23:** Swagger "Authorize" button (`AddSecurityDefinition`/`AddSecurityRequirement`), role-gated `GET /api/users` `[Authorize(Roles="Admin")]` demo, Phase 3 close-out.
**Phase 3.1 — COMPLETE (verified 2026-10-21).** Work isolated on branch `day1-developing`; repository at `D:\Assignment\DevTask-Hub` (canonical). Phase 0–2 COMPLETE (verified).

## Completed work
- Phase 0: workspace inspection; stack decided (net10.0, SQL Server 2025 Express, Node 24); all planning docs written.
- Refresh-token strategy approved (rotation, hashed storage, httpOnly cookie, reuse detection).
- Structure revised to a **single Web API project** with folder-based layering (user decision); docs updated accordingly.
- Phase 1.1: git repo + `backend/DevTaskHub.slnx` + `DevTaskHub.Api` project exist on disk.
- Phase 1.2: `frontend/` React + TS + Vite scaffold exists (build artifacts in `dist/` indicate a build was run).
- Phase 1.3: runtime checks issued; results not reported by user.
- Phase 1.4: root `README.md` created.

## Files created/modified (by assistant, docs only)
- `docs/*.md` (7 planning documents)
- `README.md` (root, minimal)

## Commands performed (by assistant: inspection only)
```
dotnet --list-sdks · node/npm/git versions · sqlcmd @@VERSION  (Phase 0)
Get-ChildItem / git status / git log  (Phase 1.4 inspection)
```

## Known issues / open items
- **3.2 CLOSED (2026-10-23, assistant-verified):** dev login → `/me` 200 (claims match); admin login 200/Role=Admin (row Id=4, real `AQAAAA...` hash); anonymous `/me` 401; short-password register 400; cookie cycle login→refresh→logout→refresh-401; rotated refresh-token replay → 401 (reuse detection works). Token payload verified: `iss=DevTaskHub`, `aud=DevTaskHub.Client`, role claim = `ClaimTypes.Role` long-URI (`http://schemas.microsoft.com/ws/2008/06/identity/claims/role`) → `[Authorize(Roles=...)]` works with no extra config. Fix B landed via migration `5_DeleteSeedAdminRow`; migrations 3+4 remain harmless empty no-ops.
- **3.3 API facts (researched against installed packages — do not use pre-2024 tutorials):** Swashbuckle 10.3.1 → Microsoft.OpenApi **2.12.0**: all types live in namespace `Microsoft.OpenApi` (`Microsoft.OpenApi.Models` is the dead 1.x namespace — old snippets will not compile). `AddSecurityDefinition(string, IOpenApiSecurityScheme)`; `AddSecurityRequirement` now takes `Func<OpenApiDocument, OpenApiSecurityRequirement>`; the requirement key is `new OpenApiSecuritySchemeReference(name, document)`. Canonical snippet source: Swashbuckle's own `docs/configure-and-customize-swaggergen.md` ("Bearer authentication").
- Optional cosmetic leftovers in `TokenService.cs`: stray `using System.Runtime.Intrinsics.Arm;` (L3), `Jwt:key` casing (L26 — works via case-insensitive config), message typo "missiong".
- `docs/CHECKLIST.md` = master tracker. NuGet advisory: transitive `System.Security.Cryptography.Pkcs 9.0.11` (deferred to Phase 12). Phase 1.3 runtime check never reported.
- Phase 1.1–1.3 lack user-reported verification output; if anything fails in Phase 2, re-run: `dotnet build` (backend), `npm run build` (frontend), `dotnet run` + `npm run dev`.
- Solution file is `DevTaskHub.slnx` (new .NET XML solution format) rather than `.sln`; harmless — keep using it as-is.
- `frontend/README.md` is the Vite template default; root `README.md` is the real one.
- GitHub rate-limit strategy deferred to Phase 10; concurrency (rowversion) deferred until measured need.
- ~~Phase 2.1 build failures~~ — FIXED by user (casing: GitHub* enums, `User.Id`, `GitHubAccount` navigation); verified by assistant: `dotnet build` → 0 errors.

## Git state
- Branch: **`day1-developing`** (created 2026-10-20 from `main` @ b3fa65d) — all Day-1 work lives here.
- Day-1 work on this branch: **commit `80bce18` — "feat(domain): entities and enums (day 1)"** (10 files: 9 Domain entities/enums + progress doc). Build verified green.
- **Caution (2026-10-20):** an OLD repo exists at `D:\DevTaskHub` with a similarly-named branch `day1-development` (−ment) already on GitHub — do NOT work there. Canonical repo: `D:\Assignment\DevTask-Hub`, branch `day1-developing` (−ing). User advised to push new branch and abandon old repo.
- `main` stays clean/stable at Phase 1; merge `day1-developing` → `main` when a day's work is verified.
- Rollback options: `git revert <sha>` (safe, keeps history) or `git reset --hard main` on the feature branch (discards unmerged commits) — details in the session notes.

## Next permitted action
User types Phase 3.3 code (Swagger security config in `Program.cs`; new `Dtos/UserDtos.cs`, `Services/IUserService.cs`, `Services/UserService.cs`, `Controllers/UsersController.cs`; DI registration), runs the test matrix (anonymous 401 · dev 403 · admin 200 · Swagger Authorize button sends header), then types `next` → assistant verifies and, if all pass, closes Phase 3 → **Phase 4.1**: frontend foundation (layout, Axios client with bearer + 401 interceptor, auth context).
