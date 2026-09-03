# Revenue Risk Engine

The risk engine is a deterministic, explainable foundation. It does not claim to be production machine learning and does not present synthetic predictions as real-world financial forecasts.

## Score contract

Each payment risk result contains:

- `score`: bounded integer from 0 to 100, displayed as `score / 100`
- `level`: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`
- `factors`: named contributing factors with numeric contributions and explanations
- `recoveryProbability`: deterministic rule estimate, expressed as a percentage
- `predictionLabel`: `DEMO PREDICTION` for demo merchants or `DETERMINISTIC RULE OUTPUT` otherwise

Factors cover payment failure, retryability, checkout abandonment, subscription failure, amount, customer lifetime value, and time horizon.

## Revenue at risk

`GET /api/revenue-risk` returns amount, transaction count, customer segment, failure reason, risk score, time horizon, recovery probability, and item-level explanations. Monetary values are serialized decimal strings.

The current query evaluates unresolved failed, pending, and expired payment attempts. It is tenant-scoped from the authenticated session and limits the initial response to 500 recent attempts for predictable API latency.

## Supported detections

- Payment failure detection from payment-attempt status and gateway reason
- Retryable failure classification from an explicit allowlist
- Checkout abandonment from structured checkout flags or abandonment reasons
- Subscription failure from structured subscription metadata
- High-value customer risk from customer segment and lifetime value
- Payment failure prediction as a deterministic rule output, not production ML

## Metrics

`evaluateRiskClassifier()` reports retryable precision/recall, abandonment detection rate, and high-value coverage. These metrics are evaluation evidence for deterministic rules or demo data only; they are not production model validation.
