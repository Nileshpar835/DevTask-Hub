# DevTask Hub — API Contracts (draft; refined as each phase completes)

**Base:** `/api` · JSON · **Problem Details** on errors · `CancellationToken` accepted on suitable operations.

**Pagination request:** `?page=1&pageSize=20&search=&sortBy=&sortDir=asc`
**Pagination response:**
```json
{ "items": [], "page": 1, "pageSize": 20, "totalCount": 0,
  "totalPages": 0, "hasNext": false, "hasPrevious": false }
```
**Auth header:** `Authorization: Bearer <jwt>`. Status codes: 401 unauthenticated, 403 forbidden (authenticated but not allowed).

Do not connect React to an endpoint until it is implemented and verified in Swagger.

---

## Auth
| Method & route | Success | Failure | Notes |
|---|---|---|---|
| POST `/api/auth/register` | 201 `{accessToken, expiresAt, user}` + Set-Cookie refresh | 400 validation, 409 duplicate email | Public registration **always creates Developer** |
| POST `/api/auth/login` | 200 `{accessToken, expiresAt, user}` + Set-Cookie refresh | 401 invalid credentials | In-memory login throttle (basic) |
| POST `/api/auth/refresh` | 200 new access token + rotated cookie | 401 invalid/reused/expired | Reads httpOnly cookie; rotation + reuse detection |
| POST `/api/auth/logout` | 204 revoke cookie token, clear cookie | 401 | Idempotent enough for client UX |
| GET `/api/auth/me` | 200 profile | 401 | |
| PUT `/api/auth/me` | 200 update fullName / GitHub username | 400 | |

## Admin — users
| Method & route | Success | Notes |
|---|---|---|
| GET `/api/users` | 200 paged (`role`, `active`, `search`) | [Admin] |
| PUT `/api/users/{id}/role` | 200 | [Admin] cannot demote the last Admin |
| PUT `/api/users/{id}/status` | 200 activate/deactivate | [Admin] cannot deactivate last Admin |
| DELETE `/api/users/{id}` | 204 (deactivates) | [Admin] 409 if last admin |

## Projects
| Method & route | Success | Notes |
|---|---|---|
| GET `/api/projects` | 200 paged (`search`, `status`, `mine`) | Developer sees only member projects; Admin sees all |
| POST `/api/projects` | 201 | [Admin] |
| GET `/api/projects/{id}` | 200 | 403 non-member, 404 missing |
| PUT `/api/projects/{id}` | 200 | [Admin] |
| DELETE `/api/projects/{id}` | 204 | [Admin] 409 if project still has non-archived tasks |
| GET `/api/projects/{id}/members` | 200 | [member] |
| POST `/api/projects/{id}/members` | 201 `{userId}` | [Admin] 409 duplicate |
| DELETE `/api/projects/{id}/members/{userId}` | 204 | [Admin] 409 if last owner |
| GET `/api/projects/{id}/stats` | 200 task status counts | [member] |

## Tasks
| Method & route | Success | Notes |
|---|---|---|
| GET `/api/tasks` | 200 paged | Filters: `projectId`, `assigneeId`, `status`, `priority`, `dueBefore`, `dueAfter`, `search`, `sortBy`, `sortDir`. Admin: all; Developer: member projects only |
| POST `/api/tasks` | 201 | [Admin, or project member with create rights] 400/403 |
| GET `/api/tasks/{id}` | 200 | 403 non-member, 404 |
| PUT `/api/tasks/{id}` | 200 | [member] title, description, priority, dueDate |
| PATCH `/api/tasks/{id}/status` | 200 `{status}` | [assignee/ member per rules] only allowed transitions |
| PATCH `/api/tasks/{id}/assignee` | 200 `{userId \| null}` | assignee must be a project member |
| DELETE `/api/tasks/{id}` | 204 | [Admin or task creator] |
| GET `/api/tasks/{id}/activity` | 200 paged activity log | [member] |

**Status transitions (enforced server-side):**
```
ToDo → InProgress
InProgress → InReview | ToDo
InReview → Done | InProgress
Done → InProgress   (reopen; Admin or assignee)
```

## Dashboards
| Route | Returns |
|---|---|
| GET `/api/dashboard/admin` | `{totalProjects, totalUsers, totalDevelopers, taskStatusCounts, overdueTasks, recentActivity}` [Admin] |
| GET `/api/dashboard/developer` | `{assignedCountsByStatus, dueSoon, overdue, projects, linkedPullRequests}` (self) |

## GitHub
| Method & route | Success | Failure |
|---|---|---|
| POST `/api/github/profile` `{username}` | 200 profile (cached if fresh) | 404, 429 rate-limited, 502 upstream |
| GET `/api/github/profile` | 200 linked account | 404 |
| DELETE `/api/github/profile` | 204 | |
| POST `/api/tasks/{id}/pull-requests` `{url}` | 201 | 400 invalid URL, 404 repo/PR missing, 409 already linked, 429 |
| GET `/api/tasks/{id}/pull-requests` | 200 | |
| POST `/api/tasks/{id}/pull-requests/{prId}/sync` | 200 refreshed | 404, 429, 502 |

UI sync respects a 15-minute freshness window (`LastSyncedAtUtc`) to avoid excess GitHub API calls.
