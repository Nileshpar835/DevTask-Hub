# DevTask Hub — UI Plan

## Layout
- **Desktop:** fixed sidebar (logo, nav links, user chip at bottom) + top bar (page title, optional search, avatar menu).
- **Mobile:** hamburger opens a slide-in sidebar; tables become stacked cards or horizontal scroll — the page itself never overflows.

## Routes (lazy-loaded per route group)
| Route | Access | Purpose |
|---|---|---|
| `/login`, `/register` | public | auth forms |
| `/` | authed | role-aware dashboard |
| `/projects` | authed | project list |
| `/projects/new` | Admin | create form |
| `/projects/:id` | member | details + stats |
| `/projects/:id/edit` | Admin | edit form |
| `/projects/:id/members` | Admin | member management |
| `/tasks` | authed | task list + filters |
| `/tasks/:id` | member | task details + activity + PRs |
| `/tasks/new?projectId=` | member | create form |
| `/users` | Admin | user management |
| `/profile` | authed | profile + GitHub link/unlink |
| `*` | any | 404 Not Found |
| 403 | any | Forbidden page |

## Design system (plain CSS variables, no UI framework initially)
```css
--bg: #f7f8fa; --surface: #fff; --border: #e4e7ec;
--text: #101828; --muted: #667085;
--primary: #2563eb; --danger: #d92d20; --success: #12b76a; --warning: #f79009;
```
- Radius 8px; spacing scale 4/8/12/16/24/32; system UI font stack.
- One restrained accent color; subtle borders; restrained shadows; no gradients or oversized heroes.
- Components built only when first needed: Button, Input, Select, Badge (status/priority), Card, Table (with mobile fallback), Modal, EmptyState, ErrorState, Spinner, Pagination, FormField (label + error + aria-describedby).

## States (every list and dashboard)
loading (spinner) · error (message + retry button) · empty (explanatory text + CTA) · success (data).

## Forms
- Field-level validation messages; input preserved when a request fails; submit disabled while pending; focus moves to the first invalid field.
- Client validation is UX only — the server validates everything again.
- Accessible: labels tied to inputs, visible focus states, keyboard-friendly dialogs.

## Performance habits
- Route-level code splitting (React.lazy) per route group.
- `useMemo`/`useCallback` only where a measured re-render problem exists — no reflexive wrapping.
- Never paginate client-side over a full dataset; the API pages and filters.
