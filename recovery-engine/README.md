# Smart Recovery Engine

The recovery engine evaluates recovery strategies without executing them.

## Supported strategies

- Retry
- Payment Link
- Alternative Payment Method
- Reminder
- Personalized Message
- Human Assistance
- Do Nothing

## What-if simulator

`POST /api/recovery/simulation` accepts an authenticated merchant opportunity and an optional list of strategies. It returns one projection per selected strategy:

- expected recovery
- recovery probability
- risk
- cost
- ROI
- customers affected
- time to recovery
- rationale

The response is labeled `SIMULATION ONLY` and `sideEffectFree: true`. The engine has no Prisma, payment provider, webhook, ledger, or execution dependency, so simulation cannot modify financial records.

Expected recovery is calculated from the opportunity amount and deterministic strategy assumptions. ROI is `(expected recovery - cost) / cost`; `DO_NOTHING` has zero cost and reports `0.00` ROI rather than an infinite value.

High-risk opportunities elevate non-observation strategies to `HIGH` risk. Strategy actions remain recommendations until deterministic policy, risk, approval, and execution services separately authorize them.
