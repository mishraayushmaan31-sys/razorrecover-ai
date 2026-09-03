# Environment Management

RazorRecover AI enforces strict boundary isolation between `DEMO`, `TEST`, and `PRODUCTION` operating modes. This document describes the environment topology and runtime configuration controls.

---

## 1. Operating Mode Matrix

| Setting                      | DEMO Mode                                           | TEST Mode                              | PRODUCTION Mode                               |
| :--------------------------- | :-------------------------------------------------- | :------------------------------------- | :-------------------------------------------- |
| **`APP_ENV`**                | `demo`                                              | `staging`                              | `production`                                  |
| **`ENABLE_DEMO_MODE`**       | `true`                                              | `false`                                | `false`                                       |
| **`ENABLE_TEST_MODE`**       | `false`                                             | `true`                                 | `false`                                       |
| **`ENABLE_PRODUCTION_MODE`** | `false`                                             | `false`                                | `false` _(Gated until Stage 5 certification)_ |
| **Data Scope**               | Synthetic merchants & payments (`DEMO_MERCHANT_ID`) | Razorpay Test Mode keys (`rzp_test_*`) | Live Razorpay production keys (`rzp_live_*`)  |
| **Financial Execution**      | Deterministic simulation only                       | Razorpay Test API orders/refunds       | Disabled by policy gate                       |
| **Labels Required**          | `DEMO MODE` badge displayed in all views            | `TEST MODE` badge displayed            | Production indicator                          |

---

## 2. Configuration Validation

Environment variables are strictly typed and parsed at application startup using `@/env.ts` and Zod:

- If a required secret or configuration is missing, the application fails to boot (`process.exit(1)`), preventing silent misconfigurations.
- In production mode, dummy or fallback secrets (e.g., `replace_with_secure_secret`) are rejected with an explicit validation error.

---

## 3. Database Isolation

- **Production Database**: Dedicated RDS Multi-AZ instance inside isolated private subnets (`10.0.20.0/24`). No developer or public internet access permitted.
- **Staging / QA Database**: Separate RDS instance in staging VPC, seeded periodically from sanitized test scripts.
- **Local / Demo Database**: Local Docker Compose container running PostgreSQL 16 on port 5432.
