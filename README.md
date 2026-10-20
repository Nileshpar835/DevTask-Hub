# DevTask Hub

Full-stack developer task & issue tracking system for software teams: projects, tasks, roles, dashboards, and GitHub pull-request synchronization.

**Status:** early development (Phase 1 complete — foundation only). See `docs/PROGRESS.md` for the live record.

## Stack
- **Backend:** ASP.NET Core Web API (net10.0), EF Core + SQL Server, JWT auth with refresh-token rotation — `backend/DevTaskHub.Api`
- **Frontend:** React 19 + TypeScript + Vite — `frontend/`
- **Database:** SQL Server (local: `localhost\SQLEXPRESS`, database `DevTaskHubDb`)

## Repository layout
```
backend/   ASP.NET Core Web API (single project, folder-based layering)
frontend/  React SPA
docs/      Architecture, database design, API contracts, progress record
```

## Running locally (once implemented)
```powershell
# backend (from backend/)
dotnet run --project DevTaskHub.Api

# frontend (from frontend/)
npm install
npm run dev        # http://localhost:5173
```
Detailed setup (connection strings, user-secrets, migrations) will be documented here as those phases complete.

## Documentation
| Doc | Purpose |
|---|---|
| `docs/PROJECT_PLAN.md` | Phases, decisions, testing strategy |
| `docs/ARCHITECTURE.md` | Layout, request flow, folder rules |
| `docs/DATABASE_DESIGN.md` | Schema, constraints, migrations |
| `docs/API_CONTRACTS.md` | Endpoints and DTO shapes |
| `docs/UI_PLAN.md` | Routes, design system, components |
| `docs/SECURITY.md` | Auth, secrets, authorization |
| `docs/PROGRESS.md` | Current phase and history |
