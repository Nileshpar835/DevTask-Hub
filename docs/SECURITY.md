# DevTask Hub — Security

## Secrets
- **Backend local dev:** .NET user-secrets for connection string, JWT signing key, initial-admin seed credentials.
- **Deployed:** environment variables. Never in source control; `.gitignore` excludes secret files.
- **Frontend:** `.env` holds only `VITE_API_BASE_URL` (public). No secrets in React, ever.

## Password handling
- Hashing: ASP.NET Core `PasswordHasher<T>` (PBKDF2). No hand-rolled crypto.
- Passwords never logged, never returned by any API, never included in DTOs after creation.

## Authentication
- **Access token:** JWT, HS256, 15-minute lifetime; claims `sub`, `email`, `role`, `name`. Validated: signature, issuer, audience, lifetime.
- **Refresh token:** opaque random value, 14-day absolute lifetime, **stored only as a SHA-256 hash** in `RefreshTokens`.
- Delivered as `httpOnly; SameSite=Lax; Path=/api/auth` cookie (`Secure` in production). Client-side JS cannot read it.
- **Rotation:** every `/api/auth/refresh` revokes the presented token and issues a successor (`ReplacedByTokenId` chain).
- **Reuse detection:** presenting a revoked token revokes every outstanding token for that user.
- Access token lives **in memory only** in the SPA (never localStorage/sessionStorage).
- Logout: server revokes the refresh token, clears the cookie; client drops the access token.
- Never log passwords, raw tokens, or hashes.

## Authorization (server-side)
- Policies: `Admin` (role claim), plus per-resource membership checks inside services (`ProjectMember`). Hiding buttons in React is not authorization.
- **Public registration always creates Developer.** No self-elevation path exists in the register endpoint.
- **Initial admin provisioning:** on first run, if no Admin exists, the API seeds one from user-secrets/env-var credentials (documented, local-friendly). Production: env vars consumed once by the seeder. There is no "first registered user becomes admin" behavior (too easy to abuse).

## Transport & headers
- HTTPS in production; local dev HTTP is an accepted, documented limitation.
- CORS: allow only the configured frontend origin (`http://localhost:5173` locally). No wildcard origins with credentials.

## Abuse & error handling
- Basic in-memory login throttling (per username/IP) in Phase 3.
- Global exception middleware returns Problem Details without stack traces; details only in structured logs.
- Rate limiting awareness for GitHub calls: respect `X-RateLimit-Remaining`/`Retry-After`; surface 429 as a friendly error.

## GitHub integration
- Phase 10 uses **public, unauthenticated** profile/PR retrieval only — no tokens stored at all.
- Raw GitHub PATs are forbidden in this codebase.
- Future OAuth / private-repo access requires: encrypted-at-rest token store, scope minimization, and a design review recorded in this document before implementation.
