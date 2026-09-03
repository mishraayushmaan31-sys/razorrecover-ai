# Human Review and Explainability Ledger

## Review queue

`GET /api/human-review` returns pending review items with:

- AI recommendation
- Evidence
- Confidence
- Risk
- Policy evaluation context
- Approval state
- Expected recovery
- Customer impact
- Proposed action

## Review actions

`POST /api/human-review/:reviewId` accepts:

- `APPROVE`
- `REJECT`
- `MODIFY`
- `ASSIGN`
- `ESCALATE`

Owners and finance/operations managers can perform review actions. Viewers and developers cannot approve or reject financial recovery actions. Assignees must belong to the same merchant tenant.

Approval never executes a payment. It moves the recovery action to `APPROVED_FOR_DETERMINISTIC_EXECUTION`; a separate deterministic execution service remains responsible for policy, risk, idempotency, and provider controls.

## Explainability Ledger

Every review decision appends a complete snapshot through `buildExplainabilitySnapshot()` and the transactional review service. The snapshot includes action ID, timestamp, transaction, customer, agent, decision, evidence, confidence, risk, policy, approval, result, and revenue rescued.

`GET /api/explainability-ledger` is read-only. There are no normal application update or delete operations for explainability records, and the database model has no update timestamp or soft-delete field. Historical rows are preserved when a review is modified, assigned, or escalated.
