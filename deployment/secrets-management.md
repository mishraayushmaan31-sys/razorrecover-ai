# Secrets Management

This document defines the secrets architecture, encryption mechanisms, access policies, and rotation schedules for RazorRecover AI.

---

## 1. Secrets Inventory

| Secret Key | Purpose | Storage Service | Rotation Cadence |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string with TLS | AWS Secrets Manager (`razorrecover/prod/app-secrets`) | 90 days |
| `JWT_SECRET` | Token signing secret for user authentication | AWS Secrets Manager (`razorrecover/prod/app-secrets`) | 60 days |
| `SESSION_SECRET` | 32-character AES-GCM session encryption secret | AWS Secrets Manager (`razorrecover/prod/app-secrets`) | 90 days |
| `RAZORPAY_KEY_ID` | Merchant gateway public API key | AWS Secrets Manager (`razorrecover/prod/app-secrets`) | Annual / As needed |
| `RAZORPAY_KEY_SECRET` | Merchant gateway private API secret | AWS Secrets Manager (`razorrecover/prod/app-secrets`) | Annual / Immediate on breach |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC-SHA256 signature verification key | AWS Secrets Manager (`razorrecover/prod/app-secrets`) | Annual / Immediate on breach |

---

## 2. Encryption at Rest & in Transit

1. **AWS KMS Customer Managed Key (CMK)**: All secrets in AWS Secrets Manager are encrypted using a dedicated KMS key (`aws_kms_key.rds`) with automatic yearly rotation enabled.
2. **TLS 1.3 in Transit**: All connections to RDS, Redis, and Razorpay endpoints mandate TLS with verification enabled (`sslmode=require`).
3. **No Environment Leaks**: Application logs (`lib/logger.ts`) sanitize sensitive keys (`passwordHash`, `token`, `secret`, `authorization`, `signature`).

---

## 3. Rotation Procedure (Zero Downtime)

1. **JWT & Session Secret Rotation**:
   - The application supports dual-key verification during rotation windows:
     1. New key is deployed as `JWT_SECRET_PRIMARY`.
     2. Previous key is maintained as `JWT_SECRET_SECONDARY` for 24 hours to honor active sessions.
     3. After 24 hours, the secondary key is decommissioned.
2. **Database Password Rotation**:
   - Managed automatically via AWS Secrets Manager RDS rotation lambda function.

