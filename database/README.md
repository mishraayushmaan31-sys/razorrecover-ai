# Database Layer

This directory contains the server-side database foundation for RazorRecover AI.

## Included

- Prisma schema at `prisma/schema.prisma`
- Migration SQL under `prisma/migrations/`
- Seed structure at `prisma/seed.ts`
- Database utilities in `database/utils/`
- Base and domain repository patterns in `database/repositories/`
- Unit tests in `database/tests/`

## Financial safety

All money is normalized via `database/utils/financial.ts` to avoid float errors and keep finite values safe for ledger operations.

## Usage

1. Create or update your server-side environment variables.
2. Run `npx prisma generate` after changing the schema.
3. Run `npx prisma migrate dev` when working against a local Postgres instance.
4. Run `npx prisma db seed` or `npm run db:seed` to seed demo data.

## Notes

- No database credentials are exposed to the frontend.
- This is a foundational layer only; feature implementations should build on top of it rather than bypassing it.
