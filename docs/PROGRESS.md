# DevTask Hub — Progress Record

## Current phase
**Phase 1 — COMPLETE (closing commit pending user run).**
Phases 1.1–1.3 advanced by user without pasted verification output; scaffolds confirmed present on disk 2026-10-20 (`backend/DevTaskHub.Api`, `frontend/` Vite app, root `.gitignore`, git repo with 2 prior commits). Treat runtime behavior as UNVERIFIED until re-checked.

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

## Git state
- Repo initialized; user has made 2 commits labeled "first commit".
- Uncommitted at time of writing: `docs/PROGRESS.md` (phase updates) + new `README.md`.
- Suggested commit message:
  `docs: close phase 1 — root readme and progress update`

## Next permitted action
User commits Phase 1.4 files, then types `next` → **Phase 2.1**: Domain entities (`User`, `Project`, `ProjectMember`, `Task`, `GitHubAccount`, `TaskPullRequest`, `TaskActivityLog`, `RefreshToken`) + enums + `AppDbContext` — hand-typed per assistant instructions.
