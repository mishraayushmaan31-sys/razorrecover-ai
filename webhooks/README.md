# Webhook Event Processing

Webhook processing is server-side and transactional.

## Supported provider events

- `payment.authorized`
- `order.paid`
- `payment.failed`
- `payment_link.created`

## Supported internal events

- `recovery.started`
- `recovery.completed`
- `recovery.failed`
- `risk.blocked`
- `human_review.created`

## Guarantees

- Raw Razorpay body signatures are verified before persistence.
- `(merchantId, dedupeKey)` prevents duplicate event records.
- Revenue ledger references are unique per merchant and business event.
- Payment states are monotonic, so stale/out-of-order deliveries cannot regress a captured payment to failed.
- Failed processing is marked `retryable` for attempts one and two.
- Attempt three is marked `dead_letter` with the last error and timestamp.
- Audit records are created in the same transaction as successful event processing.
- Unknown events and invalid signatures are rejected before persistence.

The Razorpay route requires `x-merchant-id`, `x-razorpay-event-id`, and `x-razorpay-event` headers. The internal processor accepts structured typed events and does not execute arbitrary commands.
