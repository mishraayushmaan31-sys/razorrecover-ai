# Development Guide

## Prerequisites

- Node.js 22 or newer
- npm
- PostgreSQL 16, or Docker Desktop

## Install and configure

```bash
npm install
copy .env.example .env
npm run db:generate
```

`DATABASE_URL` is server-only. Do not prefix it with `NEXT_PUBLIC_` or import it from browser components.

## Run locally

```bash
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. The backend health endpoint is available at `http://localhost:3000/api/health`.

When PostgreSQL is unavailable, the page still renders but the health endpoint returns HTTP 503 with the standard API error envelope.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

## Authentication and Authorization

Authentication endpoints:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Sessions use signed, HTTP-only cookies. Roles and permissions are defined in `auth/permissions.ts`; the owner controls the critical settings and kill-switch permission. Protected APIs return `401` for missing sessions and `403` for insufficient permissions.

## Boundaries

- `src/app` owns UI and HTTP route handlers.
- `src/server/services` owns server-side application services.
- `database` owns Prisma access and persistence utilities.
- `auth` and `authorization` own credential, session, permission, and tenant checks.
- External payment and AI integrations remain unimplemented in this foundation.
- Financial mutations must remain server-side and use the deterministic service and policy boundaries documented in `docs/technical-architecture.md`.

`DATABASE_URL`, `SESSION_SECRET`, and password hashes are server-only. Never prefix secrets with `NEXT_PUBLIC_` or import them from browser components.
