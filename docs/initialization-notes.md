# Initialization Notes

## Current status

The repository is empty and has been initialized as a blank project foundation for RazorRecover AI.

## Canonical guardrails

- No direct LLM execution of money movement.
- No frontend access to Razorpay secret credentials.
- No financial action without server-side validation and policy gating.
- Demo data is explicitly isolated from real data and test data.
- Every major UI action must map to a real backend function.

## Conventions to maintain throughout project development

- Use TypeScript across frontend and backend.
- Prefer Next.js for the app shell and API routes.
- Use Prisma with PostgreSQL for transactional data.
- Keep AI provider interactions abstracted behind a service layer.
- Treat env var names as global conventions across the codebase.
- Use deterministic policy evaluation rather than model-only decisioning.
- Maintain immutable audit logs as required for financial operations.
