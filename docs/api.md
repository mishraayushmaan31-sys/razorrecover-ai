# REST API Foundation

All API responses use this envelope:

```json
{ "ok": true, "data": {}, "requestId": "uuid" }
```

Errors use:

```json
{ "ok": false, "error": { "code": "CODE", "message": "..." }, "requestId": "uuid" }
```

## Authentication

| Method | Path               | Auth    | Permission | Status                |
| ------ | ------------------ | ------- | ---------- | --------------------- |
| POST   | `/api/auth/signup` | Public  | None       | Creates owner session |
| POST   | `/api/auth/login`  | Public  | None       | Creates session       |
| POST   | `/api/auth/logout` | Session | None       | Clears session        |
| GET    | `/api/auth/me`     | Session | None       | Returns current user  |

## Tenant resources

| Methods | Path | Permission | Idempotency |
| --- | --- | --- |
| GET, POST | `/api/customers` | dashboard:view / operations:manage | POST required |
| GET, POST | `/api/transactions` | financials:view / financials:manage | POST required |
| GET, POST | `/api/payments` | financials:view / financials:manage | POST required |
| GET, POST | `/api/recovery-opportunities` | dashboard:view / operations:manage | POST required |
| GET, POST | `/api/incidents` | dashboard:view / operations:manage | POST not required |
| GET, POST | `/api/policies` | dashboard:view / settings:manage | POST not required |
| GET | `/api/notifications` | dashboard:view | No |
| GET, POST | `/api/experiments` | dashboard:view / operations:manage | POST not required |

Every persisted resource query includes the authenticated session's `merchantId`; tenant identity is never accepted from the request body.

## Control and analytics endpoints

| Method | Path | Permission | Behavior |
| --- | --- | --- |
| GET | `/api/revenue-risk` | dashboard:view | Explainable deterministic risk and revenue-at-risk summary |
| GET | `/api/ai-recommendations` | dashboard:view | Safe service scaffold |
| POST | `/api/recovery/simulation` | operations:manage | Compares allowlisted strategies; side-effect free |
| POST | `/api/recovery/execution` | recovery:execute | Returns `501` until deterministic execution exists |
| GET | `/api/human-review` | dashboard:view | Safe service scaffold |
| GET | `/api/audit` | dashboard:view | Safe service scaffold |
| GET | `/api/webhooks` | dashboard:view | Safe service scaffold |
| GET | `/api/forecast` | dashboard:view | Safe service scaffold |
| GET | `/api/analytics` | dashboard:view | Safe service scaffold |
| POST | `/api/owner/kill-switch` | system:kill_switch | Owner-only scaffold; does not mutate state |

## Common behavior

- Missing or invalid session: `401 UNAUTHENTICATED`.
- Missing permission: `403 FORBIDDEN`.
- Invalid input: `400 VALIDATION_ERROR`.
- Mutating financial and recovery endpoints require `Idempotency-Key`.
- In-memory per-IP/per-permission rate limiting is active at 120 requests per minute for the foundation.
- All route failures receive a request ID and structured server logging.
- AI recommendation inputs are structured data only. No endpoint accepts or executes arbitrary commands.
- Provider webhook signature verification and durable deduplication remain a later integration milestone; the current webhook route is intentionally read-only.

## Demo Mode

| Method | Path                           | Permission         | Purpose                                            |
| ------ | ------------------------------ | ------------------ | -------------------------------------------------- |
| POST   | `/api/demo/initialize`         | developer:access   | Rebuilds the deterministic 10,000-attempt scenario |
| POST   | `/api/demo/reset`              | system:kill_switch | Restores the canonical demo dataset                |
| POST   | `/api/demo/scenario`           | operations:manage  | Selects a presentation scenario                    |
| POST   | `/api/demo/events`             | operations:manage  | Generates a deterministic synthetic event          |
| POST   | `/api/demo/webhooks`           | webhooks:manage    | Simulates a verified provider webhook              |
| POST   | `/api/demo/recovery-execution` | recovery:execute   | Executes only a deterministic demo recovery        |

All demo mutations verify `Merchant.mode = DEMO`. The generator never deletes test or production tenants. See `demo-data/README.md` for the five-minute presentation sequence.

## Human review and explainability

| Method | Path                          | Permission                | Behavior                                                                                                        |
| ------ | ----------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/human-review`           | dashboard:view            | Returns pending recommendations with evidence, confidence, risk, policy, customer impact, and expected recovery |
| POST   | `/api/human-review/:reviewId` | authenticated review role | Approves, rejects, modifies, assigns, or escalates a review                                                     |
| GET    | `/api/explainability-ledger`  | audit:view                | Reads append-only decision snapshots                                                                            |

Review mutations are tenant-scoped and action-role checked. Approval changes state only; it never executes a payment. Each decision appends an explainability snapshot and audit record. Explainability records have no normal update/delete API.

The recovery simulator compares Retry, Payment Link, Alternative Payment Method, Reminder, Personalized Message, Human Assistance, and Do Nothing. It returns expected recovery, probability, risk, cost, ROI, customers affected, time to recovery, and rationale. It is labeled `SIMULATION ONLY` and never mutates payments, actions, or ledger records.

## Razorpay Test Mode

| Method | Path                                             | Permission         | Requirements                                    |
| ------ | ------------------------------------------------ | ------------------ | ----------------------------------------------- |
| POST   | `/api/integrations/razorpay/orders`              | financials:manage  | Validated payload and `Idempotency-Key`         |
| GET    | `/api/integrations/razorpay/payments/:paymentId` | financials:view    | Bounded retries for transient provider failures |
| POST   | `/api/integrations/razorpay/payment-links`       | financials:manage  | Validated payload and `Idempotency-Key`         |
| POST   | `/api/integrations/razorpay/webhooks`            | Provider signature | Raw-body HMAC-SHA256 verification               |

Responses identify `RAZORPAY TEST MODE`. These routes never claim production execution. Provider credentials remain server-only, and Demo Mode uses separate routes and synthetic provider IDs. See `razorpay/README.md` for configuration.

## Webhook processing

`POST /api/integrations/razorpay/webhooks` verifies the raw request body signature, requires merchant and event identity headers, persists the event, and processes supported payment/recovery events transactionally. Duplicate events return a duplicate result and cannot create duplicate ledger revenue. Failed events retry twice, then move to `dead_letter`; unknown events and invalid signatures are rejected before persistence. See `webhooks/README.md` for the event contract.
