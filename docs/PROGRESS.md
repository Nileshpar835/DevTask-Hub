# DevTask Hub — Progress Record

## Current phase
**Phase 1.2 — Frontend scaffold (instructions issued 2026-10-20; awaiting user execution)**
Phase 0 — COMPLETE. Phase 1.1 — advanced by user without reporting build output (treat as UNVERIFIED; re-run `dotnet build` in `backend/` if anything fails later).

## Completed work
- Inspected workspace: `D:\DevTaskHub` was empty; git not initialized.
- Verified installed tools:
  - .NET SDK 10.0.401 (target net10.0, LTS)
  - dotnet-ef 10.0.11 (global tool)
  - Node.js v24.20.0, npm 11.19.0 (registry reachable)
  - Git 2.55.0.windows.5
  - SQL Server 2025 Express, instance `localhost\SQLEXPRESS`, service running, connection verified via sqlcmd
- Decided architecture, database schema (7 tables + RefreshTokens), API/UI/security plans.
- Approved refresh-token strategy: rotation + httpOnly cookie + reuse detection.
- **Structure revised (user decision):** single `DevTaskHub.Api` project with folder-based layering replaces the 4-project split. `ARCHITECTURE.md` and `PROJECT_PLAN.md` updated.
- User began the 4-project scaffold (solution + projects created) but chose to collapse to one project; that layout is being replaced.

## Files created
- `docs/PROJECT_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE_DESIGN.md`
- `docs/API_CONTRACTS.md`, `docs/UI_PLAN.md`, `docs/SECURITY.md`, `docs/PROGRESS.md`

## Commands performed (inspection only)
```
dotnet --list-sdks
dotnet tool list -g
node --version && npm --version && git --version
sqlcmd -S localhost\SQLEXPRESS -Q "SELECT @@VERSION"
npm view vite version && npm view react version
```
All succeeded.

## Known issues / open items
- Old 4-project scaffold under `backend/` must be deleted before re-running Phase 1.1.
- Git repository not initialized yet.
- GitHub rate-limit strategy to be implemented in Phase 10.
- Concurrency control (rowversion) deferred until measured need.

## Next permitted action
User executes Phase 1.2 (`npm create vite@latest frontend -- --template react-ts`, `npm install`, `npm run build`), reports output, then types `next` → **Phase 1.3**: run backend and frontend side by side and confirm they start independently.
