# Deterministic Demo Mode

Demo Mode is a synthetic, repeatable scenario for a five-minute RazorRecover AI presentation.

## Scenario

- 1 merchant in `AppMode.DEMO`
- 200 high-value synthetic customers
- 10,000 orders, transactions, payments, and payment attempts
- 1,800 failed attempts
- 700 retryable attempts
- 450 abandoned attempts
- Approximately INR 850,000 at risk
- Exactly INR 310,000 represented as recovered ledger credit
- Synthetic incidents, webhooks, human reviews, audit logs, and recovery actions

Every generated record has `DEMO MODE` metadata and fixed IDs. The generator uses deterministic arithmetic rather than random values, so repeated resets produce the same scenario.

## Presentation flow

1. Initialize the scenario with `POST /api/demo/initialize`.
2. Select `payment-failure-wave`, `retryable-recovery`, or `abandoned-high-value` with `POST /api/demo/scenario`.
3. Show customers, payments, transactions, and recovery opportunities through the existing tenant APIs.
4. Generate a synthetic event with `POST /api/demo/events`.
5. Simulate a verified demo webhook with `POST /api/demo/webhooks`.
6. Execute a known `RETRY_PAYMENT` recovery through `POST /api/demo/recovery-execution` using an `Idempotency-Key`.
7. Replay the same request to demonstrate idempotency.
8. Reset with `POST /api/demo/reset` to restore the canonical dataset.

## Isolation

- Demo routes verify the authenticated merchant's database mode before mutation.
- Reset deletes only merchants where `mode = DEMO`, then recreates the canonical demo tenant.
- No demo route calls Razorpay or any external provider.
- No arbitrary AI command or execution payload is accepted.
- Test and production merchants are rejected by `DEMO_MODE_REQUIRED`.

## Important

The initialization dataset is intentionally large. Run it against a local or disposable PostgreSQL database, not a production database. Authentication is required, and initialize/reset controls are restricted to development or owner permissions.
