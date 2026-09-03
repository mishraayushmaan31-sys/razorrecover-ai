# Rollback Procedure

This document provides exact, step-by-step procedures to revert an unhealthy release in staging or production.

---

## 1. Quick Decision Matrix

| Severity    | Incident Symptom                                                             | Action                                | Target RTO   |
| :---------- | :--------------------------------------------------------------------------- | :------------------------------------ | :----------- |
| **P0**      | Health check fails on `/api/health`, 5xx spike > 5%, or DB connectivity lost | Immediate ECS Task Rollback           | < 3 minutes  |
| **P1**      | Erroneous UI display or non-critical background worker crash                 | ECS Task Rollback to previous tag     | < 10 minutes |
| **P0-Data** | Bad database migration applied affecting ledger or transaction tables        | Restore RDS Snapshot to Point-in-Time | < 25 minutes |

---

## 2. Automated ECS Task Rollback (Fastest)

If a new deployment causes errors, revert to the previous task definition revision immediately:

```bash
# 1. Identify previous healthy task definition revision
PREV_REVISION=$(aws ecs describe-task-definition \
  --task-definition razorrecover-production-task \
  --query 'taskDefinition.revision' --output text)

TARGET_REVISION=$((PREV_REVISION - 1))

# 2. Update ECS service to previous revision
aws ecs update-service \
  --cluster razorrecover-production-cluster \
  --service razorrecover-production-service \
  --task-definition razorrecover-production-task:${TARGET_REVISION} \
  --force-new-deployment

# 3. Monitor rollout
aws ecs wait services-stable \
  --cluster razorrecover-production-cluster \
  --services razorrecover-production-service

# 4. Verify health
curl -f https://app.razorrecover.com/api/health
```

---

## 3. Database Migration Rollback

If a migration introduced a breaking schema defect:

1. **Down-Migration via Prisma**:

   ```bash
   npx prisma migrate diff \
     --from-schema-datamodel prisma/schema.prisma \
     --to-migrations prisma/migrations \
     --script > rollback.sql

   # Review and apply rollback.sql against database
   npx prisma db execute --file rollback.sql
   ```

2. **Point-In-Time Recovery (PITR)**:
   If data corruption occurred:
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier razorrecover-production-db \
     --target-db-instance-identifier razorrecover-production-db-restored \
     --restore-time 2026-09-03T08:00:00.000Z \
     --db-subnet-group-name razorrecover-production-db-subnet
   ```
