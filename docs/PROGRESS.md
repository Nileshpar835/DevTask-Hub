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
- **3.2 round 4 (2026-10-22):** Fix B COMPLETED and verified — seed gone from `AppDbContext`, migration `5_DeleteSeedAdminRow` contains real `DeleteData`, applied; sqlcmd confirms plaintext admin row deleted (DB now has only the 2 dev users, **no admin yet** — seeder runs on next app start). Fix A already in place. **Fix C STILL OPEN:** `TokenService.cs` L40 still reads `_config["Jwr:Issuer"]` — commit `0bcda45` message claims the typo fix but the code was not changed (working tree clean → committed version has the typo). Also still present: stray `using System.Runtime.Intrinsics.Arm;` (L3), `Jwt:key` casing (L26, works via case-insensitive config). API currently stopped. **Next:** type Fix C, restart (admin seeds), 4-gate retest.
- New tracking doc: `docs/CHECKLIST.md` (master checklist of all phases with verification state).
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
