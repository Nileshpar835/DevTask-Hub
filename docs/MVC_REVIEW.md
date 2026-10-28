# Phase 11 — ASP.NET Core MVC Review & Architectural Evaluation

**Status:** Completed / Documented Deviation (No-Op for Server-Side Rendering)  
**Date:** 2026-10-28  
**Author:** DevTask Hub Core Engineering Team  

---

## 1. Context & Objective

The initial project specifications (Day 1 #1–2) referenced traditional ASP.NET Core MVC patterns, including Razor forms, tag helpers, model binding, and server-side validation via `ModelState`.

During Phase 0 and Phase 1 architectural planning, DevTask Hub adopted a **decoupled, modern single-page application (SPA) architecture**:
- **Backend**: ASP.NET Core Web API (.NET 10) serving strongly-typed RESTful JSON endpoints.
- **Frontend**: React 19 SPA with TypeScript, Vite, React Router 7, and component-based styling.

Phase 11 requires a formal architectural evaluation to determine whether any server-rendered pages (Razor views/pages) are justified in DevTask Hub or if an API-first approach remains optimal.

---

## 2. Evaluation: Server-Rendered Razor vs. Decoupled SPA

| Architectural Dimension | ASP.NET Core MVC (Razor) | Decoupled Web API + React SPA (Current) | DevTask Hub Decision & Rationale |
|---|---|---|---|
| **User Experience & Interactivity** | Full page reloads or partial tag updates; heavier latency on mobile networks. | Instant client-side transitions, optimistic UI updates, lazy chunk loading, modal dialogs without losing context. | **Winner: React SPA.** DevTask Hub requires rich task boards, filter query bars, modal editors, and live sync badges. |
| **Authentication & Session State** | Cookie-based session state (`CookieAuthenticationDefaults`), anti-forgery tokens on every POST (`[ValidateAntiForgeryToken]`). | Stateless JWT bearer tokens in memory + rotating `httpOnly; SameSite=Lax` refresh cookie. | **Winner: Web API.** Cross-platform support for mobile/desktop integrations and external API consumers. |
| **Form Handling & Validation** | Server-side Razor forms with tag helpers (`asp-for`, `asp-validation-for`) + jQuery Unobtrusive Validation. | Client-side reactive input states with instant feedback + ASP.NET Core server-side DataAnnotation DTO validation returning RFC 7807 / 400 ProblemDetails. | **Equivalent Robustness.** Server-side validation is 100% enforced in both approaches via DataAnnotations on DTOs. |
| **Code Duplication & Maintenance** | Dual UI stacks: maintaining both Razor `.cshtml` views and React `.tsx` components would double development and QA overhead. | Single coherent design system, unified CSS custom properties, consolidated component library (`Badge`, `Modal`, `Pagination`). | **Winner: React SPA.** Eliminates dual UI maintenance and prevents styling inconsistencies. |
| **Performance & Resource Utilization** | Server CPU cycles dedicated to HTML string generation on every request. | Offloaded to client browser; server CPU dedicated strictly to JSON serialization and database query execution. | **Winner: Web API.** Superior scalability and CDN edge cacheability for static assets. |

---

## 3. Server-Side Validation & Data Binding Compliance

Even though Razor `.cshtml` files are not utilized, **100% of the core competencies of ASP.NET Core Data Binding and Server-Side Validation** are fully implemented and enforced in the Web API backend:

1. **Model Binding**:
   - `[FromBody]` binding for complex JSON payloads (`TaskCreateDto`, `TaskUpdateDto`, `ProjectCreateDto`).
   - `[FromQuery]` binding for pagination, sorting, and filtering parameters (`TaskQueryParameters`, `ProjectQueryParameters`).
   - `[FromRoute]` binding for resource IDs (`/api/projects/{id}`, `/api/tasks/{id}/status`).

2. **Server-Side Validation**:
   - Strongly-typed `System.ComponentModel.DataAnnotations` attributes across all DTOs:
     - `[Required(ErrorMessage = "...")]`
     - `[StringLength(100, MinimumLength = 3)]`
     - `[EmailAddress]`
     - `[EnumDataType(typeof(TaskPriority))]`
   - Automatic ASP.NET Core model validation via `[ApiController]` and custom domain validation in application services (`ProjectService`, `TaskService`).
   - Standardized `400 Bad Request` and `422 Unprocessable Entity` responses conforming to RFC 7807 Problem Details.

---

## 4. Architectural Decision (ADR)

**Decision:**  
DevTask Hub will **maintain its 100% decoupled architecture** (ASP.NET Core Web API + React SPA). No server-rendered Razor pages or `.cshtml` views will be introduced into the runtime pipeline.

**Consequences:**
- **Positive:** Clean separation of concerns; backend remains a pure API layer ready for mobile/CLI clients; frontend bundle remains clean and decoupled; no hybrid auth synchronization complexity.
- **Negative:** None. All functional requirements (forms, input validation, role-based authorization, CRUD, dashboard visualization) are fully achieved.
