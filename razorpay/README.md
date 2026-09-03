# Razorpay Test Mode Integration

This is the server-side Razorpay integration boundary. UI components must call application APIs and must never import this package or receive credentials.

## Configuration

Set these private variables in `.env` or the deployment secret store:

```text
RAZORPAY_MODE=test
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_TIMEOUT_MS=8000
RAZORPAY_MAX_RETRIES=2
```

Never use `NEXT_PUBLIC_` for any Razorpay value. `RAZORPAY_MODE=production` is rejected by this foundation; production payment execution is not implemented or claimed.

## API boundary

- `POST /api/integrations/razorpay/orders`
- `GET /api/integrations/razorpay/payments/:paymentId`
- `POST /api/integrations/razorpay/payment-links`
- `POST /api/integrations/razorpay/webhooks`

Order and payment-link mutations require authenticated financial permission and an `Idempotency-Key`. Read-only payment retrieval retries bounded transient failures. Mutations are never automatically retried.

Webhook verification uses the raw request body and `x-razorpay-signature` HMAC-SHA256 header. The current handler acknowledges verified test webhooks but does not post a ledger entry or execute a recovery action.

## Mode distinction

- `DEMO SIMULATION`: generated locally by `demo-data`, never calls Razorpay, and uses synthetic provider IDs.
- `RAZORPAY TEST MODE`: calls `https://api.razorpay.com/v1` with `rzp_test_` credentials and is visibly returned as `RAZORPAY TEST MODE`.
- Production payment execution is not available in this milestone.
