# DevTask Hub — Database Design (SQL Server)

**Conventions:** `datetime2` stored in UTC; enums as `nvarchar` + CHECK; `int` identity primary keys; users soft-deleted via `IsActive`; `CreatedAtUtc`/`UpdatedAtAtUtc` where meaningful.

Database name (local): **DevTaskHubDb** on `localhost\SQLEXPRESS` (connection string lives in user-secrets, never in source).

---

## 1. Users
| Column | Type | Notes |
|---|---|---|
| Id | int IDENTITY PK | |
| Email | nvarchar(256) NOT NULL | UNIQUE, stored lower-cased |
| PasswordHash | nvarchar(500) NOT NULL | output of `PasswordHasher<T>` (PBKDF2) |
| FullName | nvarchar(100) NOT NULL | |
| Role | nvarchar(20) NOT NULL | CHECK (Admin \| Developer) |
| IsActive | bit NOT NULL DEFAULT 1 | deactivation instead of hard delete |
| CreatedAtUtc / UpdatedAtUtc | datetime2 NOT NULL | |

**Delete behavior:** rows are never hard-deleted (admin deactivates). FKs from Projects/Tasks use RESTRICT or SET NULL accordingly.
**Indexes:** UNIQUE on Email.

---

## 2. Projects
| Column | Type | Notes |
|---|---|---|
| Id | int IDENTITY PK | |
| Key | nvarchar(20) NOT NULL | UNIQUE, short code e.g. "DTH" |
| Name | nvarchar(150) NOT NULL | |
| Description | nvarchar(2000) NULL | |
| Status | nvarchar(20) NOT NULL DEFAULT 'Active' | CHECK (Active \| OnHold \| Archived) |
| OwnerUserId | int NOT NULL FK → Users(Id) | ON DELETE RESTRICT |
| CreatedAtUtc / UpdatedAtUtc | datetime2 NOT NULL | |

**Indexes:** IX_Projects_Status; UNIQUE on Key.

---

## 3. ProjectMembers (explicit join table)
| Column | Type | Notes |
|---|---|---|
| Id | int IDENTITY PK | |
| ProjectId | int NOT NULL FK → Projects | ON DELETE CASCADE |
| UserId | int NOT NULL FK → Users | ON DELETE RESTRICT |
| AddedAtUtc | datetime2 NOT NULL | |

**Cardinality:** projects ↔ users = many-to-many.
**Constraints:** UNIQUE (ProjectId, UserId); index on UserId (find a user's projects).

---

## 4. Tasks
| Column | Type | Notes |
|---|---|---|
| Id | int IDENTITY PK | |
| ProjectId | int NOT NULL FK → Projects | ON DELETE CASCADE |
| Title | nvarchar(200) NOT NULL | |
| Description | nvarchar(4000) NULL | |
| Status | nvarchar(20) DEFAULT 'ToDo' | CHECK (ToDo \| InProgress \| InReview \| Done) |
| Priority | nvarchar(10) DEFAULT 'Medium' | CHECK (Low \| Medium \| High \| Critical) |
| AssigneeUserId | int NULL FK → Users | ON DELETE SET NULL |
| DueDateUtc | datetime2 NULL | |
| CompletedAtUtc | datetime2 NULL | set when Status → Done |
| CreatedByUserId | int NOT NULL FK → Users | RESTRICT |
| CreatedAtUtc / UpdatedAtUtc | datetime2 NOT NULL | |

**Business rule:** `AssigneeUserId`, if set, must be a `ProjectMembers` row of the same `ProjectId` (enforced in the task service layer, not by a DB constraint).
**Indexes:** IX_Tasks_ProjectId_Status; IX_Tasks_AssigneeUserId_Status; IX_Tasks_DueDateUtc.
**Deletion:** hard delete; `TaskPullRequests` and `TaskActivityLogs` cascade with the task.
**Concurrency (optional, Phase 7):** `rowversion` column for optimistic updates if concurrent edits become a measured issue.

---

## 5. GitHubAccounts (one per user)
| Column | Type | Notes |
|---|---|---|
| Id | int IDENTITY PK | |
| UserId | int NOT NULL UNIQUE FK → Users | CASCADE — a user links at most one GitHub profile |
| GitHubUsername | nvarchar(100) NOT NULL | NOT unique across users (a public profile name is not an identity credential) |
| DisplayName | nvarchar(150) NULL | |
| AvatarUrl | nvarchar(500) NULL | |
| ProfileUrl | nvarchar(500) NULL | |
| PublicProfileJson | nvarchar(MAX) NULL | cached public profile payload |
| FetchedAtUtc | datetime2 NULL | |
| CreatedAtUtc / UpdatedAtUtc | datetime2 NOT NULL | |

---

## 6. TaskPullRequests
| Column | Type | Notes |
|---|---|---|
| Id | int IDENTITY PK | |
| TaskId | int NOT NULL FK → Tasks | ON DELETE CASCADE |
| RepositoryOwner | nvarchar(100) NOT NULL | e.g. "octocat" |
| RepositoryName | nvarchar(100) NOT NULL | e.g. "hello-world" |
| PullRequestNumber | int NOT NULL | |
| HtmlUrl | nvarchar(500) NOT NULL | canonical PR link |
| Title | nvarchar(300) NULL | last known PR title |
| GitHubState | nvarchar(20) NOT NULL | CHECK (Open \| Closed \| Merged) — **PR state, not review state** |
| IsDraft | bit NOT NULL DEFAULT 0 | |
| ReviewStatus | nvarchar(30) NULL | CHECK (NotReviewed \| ReviewPending \| Approved \| ChangesRequested); NULL = not fetched yet. A PR being Open does NOT mean it is under review. |
| LastSyncedAtUtc | datetime2 NULL | |
| SyncError | nvarchar(500) NULL | last sync failure reason (deleted repo, rate limit, network) |
| CreatedAtUtc | datetime2 NOT NULL | |

**Constraint (documented decision):** UNIQUE (RepositoryOwner, RepositoryName, PullRequestNumber) — a PR may be linked to only ONE task; prevents two tasks claiming the same work. Repository owner + name + number is GitHub's stable identity for a PR.
**Sync strategy:** compare `LastSyncedAtUtc`; force-sync endpoint always refreshes; UI sync button respects a 15-minute freshness window to avoid excess API calls; use ETag/`If-None-Matched` when the GitHub API supports it.

---

## 7. TaskActivityLogs
| Column | Type | Notes |
|---|---|---|
| Id | int IDENTITY PK | |
| TaskId | int NOT NULL FK → Tasks | ON DELETE CASCADE |
| ProjectId | int NOT NULL FK → Projects | ON DELETE **NoAction** (revised 2026-10-21: SQL Server forbids the multiple cascade path `Projects→Tasks→ActivityLogs` + `Projects→ActivityLogs`; logs are still removed via the TaskId cascade when the task/project is deleted) |
| ActorUserId | int NOT NULL FK → Users | RESTRICT |
| Action | nvarchar(50) NOT NULL | Created \| StatusChanged \| Assigned \| Unassigned \| TitleEdited \| DescriptionEdited \| PriorityChanged \| DueDateChanged \| PullRequestLinked \| PullRequestUnlinked \| Reopened |
| OldValue / NewValue | nvarchar(200) NULL | e.g. status before/after |
| Note | nvarchar(1000) NULL | optional human-readable detail |
| CreatedAtUtc | datetime2 NOT NULL | |

**Indexes:** IX (TaskId, CreatedAtUtc DESC); IX (ProjectId, CreatedAtUtc DESC).

---

## 8. RefreshTokens (APPROVED — rotation strategy)
| Column | Type | Notes |
|---|---|---|
| Id | int IDENTITY PK | |
| UserId | int NOT NULL FK → Users | ON DELETE CASCADE |
| TokenHash | nvarchar(200) NOT NULL UNIQUE | SHA-256 of the raw token; raw token never stored or logged |
| ExpiresAtUtc | datetime2 NOT NULL | absolute lifetime: 14 days |
| CreatedAtUtc | datetime2 NOT NULL | |
| RevokedAtUtc | datetime2 NULL | set on logout, rotation, or reuse detection |
| ReplacedByTokenId | int NULL FK → RefreshTokens(Id) | audit chain of rotations |

**Indexes:** IX_RefreshTokens_UserId (revocation of a user's family, cleanup jobs).
**Rules:**
- Access token: 15 minutes. Refresh token: 14 days, single use.
- Refresh request presents the cookie → server validates (exists, not revoked, not expired) → revokes old row → inserts successor → issues new access token + new cookie (rotation).
- Presenting an already-revoked token = theft signal → revoke every outstanding token for that user (token-family revocation).
- Refresh cookie: `httpOnly; Secure (prod); SameSite=Lax; Path=/api/auth`.
- Logout revokes the presented token and clears the cookie.

---

## Not created (with reason)
| Skipped | Reason |
|---|---|
| Roles / RolePermissions tables | 2 roles, enforced as policies in code |
| Project/Task count columns | derived from indexed SQL until performance demands caching |
| Separate ProjectActivityLogs | project activity derived from TaskActivityLogs via ProjectId |
| Per-table audit columns | only CreatedAtUtc/UpdatedAtUtc where meaningful |
| RefreshTokens.Id GUID | int identity sufficient; hash uniqueness protects the secret |

## Migration strategy
- EF Core migrations, one per approved schema change, named `<Phase>_<Description>` (e.g. `2_InitialSchema`).
- Initial migration created and applied in Phase 2.3 via `dotnet ef database update`.
- Migrations live in Infrastructure and are source-controlled; never edit an applied migration by hand — add a new one.
