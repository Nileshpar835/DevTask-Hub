# DevTask Hub — Progress Record

## Current phase
**Phase 2.2 — AppDbContext + EF configuration: INSTRUCTIONS ISSUED 2026-10-20 (awaiting user typing + build).**
**Phase 2.1 — COMPLETE, independently verified:** assistant ran `dotnet build` → `0 Warning(s) 0 Error(s)` (2026-10-20); second commit `23dc24f` also present.
**Work isolated on branch `day1-developing`.**
**Repository at `D:\Assignment\DevTask-Hub` (canonical path).**
Phase 0 — COMPLETE. Phase 1 — COMPLETE.

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
User types the 2.2 files (`dotnet add package` × 2, `Data\AppDbContext.cs`), runs `dotnet build`, reports result, then types `next` → **Phase 2.3**: first EF migration (`dotnet ef migrations add 2_InitialSchema`), apply to local `DevTaskHubDb`, and inspect the generated schema together.
