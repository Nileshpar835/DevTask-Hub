# DevTask Hub — Progress Record

## Current phase
**Phase 3.2 — JWT + refresh rotation + /me + secure admin seed: INSTRUCTIONS ISSUED 2026-10-21.**
**Phase 3.1 — COMPLETE (verified by assistant 2026-10-21):** all 4 auth files present, Identity.Core installed, Swagger added by user; register/login proven working (`user@example.com` has genuine PBKDF2 hash in DB). Issues found: (a) seed admin `PasswordHash = "Nilesh"` = plaintext in source — admin login broken + secret committed; FIXED in 3.2 by runtime seeding from user-secrets + migration `3_RemovePlaceholderAdminSeed`. (b) DTO used lowercase `password`/`Fullname` — works via case-insensitive JSON binding; corrected in 3.2 DTO rewrite. (c) build "failures" were file locks from the running API process (stop before rebuild).
**Work isolated on branch `day1-developing`.**
**Repository at `D:\Assignment\DevTask-Hub` (canonical path).**
Phase 0 — COMPLETE. Phase 1 — COMPLETE. Phase 2 — COMPLETE (verified).

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
- **3.2 round 3 (2026-10-22):** Fix A applied (Jwt block in appsettings.json — token now has `aud`). Two failures remain: (3) **`/me` still 401** — `TokenService.cs` line 40 typo `_config["Jwr:Issuer"]` (transposed letters) → `iss` claim missing from token → ValidateIssuer rejects; fix: `Jwt:Issuer`. (2, still open) **Fix B skipped** — commit e0d03f5 never touched `AppDbContext.cs`; seed still at L23/L185-199; migration 4 EMPTY for the same reason as migration 3 (model unchanged vs DB); admin row Id=1 still plaintext `Nilesh` → admin login 500; DbSeeder skips. Required: delete seed method+call, migration `5_DeleteSeedAdminRow`, `database update`, restart → runtime seeder. Migrations 3+4 remain as harmless empty no-ops. Optional cleanups: stray `using System.Runtime.Intrinsics.Arm;`, `Jwt:key`→`Jwt:Key` in TokenService. Awaiting user fixes + 4-gate retest.
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
User completes Phase 3.2 (Jwt:Key + seed secrets, JwtBearer package, TokenService/AuthDtos/IAuthService/AuthService/AuthController rewrites, DbSeeder, AppDbContext seed removal, Program.cs auth pipeline, migration 3 + database update, end-to-end test: login → /me → refresh → logout), reports results, then types `next` → **Phase 3.3**: Swagger UI auth testing (bearer scheme), role-policy demonstration, and closing summary of Phase 3.
