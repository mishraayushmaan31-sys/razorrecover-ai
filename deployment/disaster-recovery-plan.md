# Disaster Recovery Plan

This document outlines the Business Continuity and Disaster Recovery (BC/DR) strategy for RazorRecover AI, targeting strict Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO).

---

## 1. Objectives

- **Recovery Point Objective (RPO)**: **< 15 minutes** (maximum acceptable data loss window).
- **Recovery Time Objective (RTO)**: **< 30 minutes** (maximum acceptable duration to restore service).

---

## 2. Disaster Scenarios & Mitigation Procedures

### Scenario A: Single Availability Zone Outage
- **Impact**: One AWS data center in `ap-south-1` becomes unreachable.
- **Automated Response**:
  - **RDS Multi-AZ**: Synchronous primary-to-standby failover triggers automatically within 60–120 seconds. DNS endpoint updates transparently.
  - **ECS Fargate**: Tasks are evenly distributed across AZ1 and AZ2. The ALB marks unhealthy targets in the affected AZ and routes 100% of traffic to healthy tasks in the surviving AZ.
  - **Intervention Needed**: None. Zero data loss (RPO = 0, RTO < 2 minutes).

### Scenario B: Database Corruption or Malicious Data Deletion
- **Impact**: Accidental drop table, corrupt migration, or unauthorized modification.
- **Recovery Procedure**:
  1. Determine the exact timestamp immediately preceding corruption (e.g., `T - 12 minutes`).
  2. Initiate AWS RDS Point-in-Time Recovery (PITR) to a restored instance using the AWS CLI or Console:
     ```bash
     aws rds restore-db-instance-to-point-in-time \
       --source-db-instance-identifier razorrecover-production-db \
       --target-db-instance-identifier razorrecover-production-db-restored \
       --restore-time <CORRUPTION_TIMESTAMP> \
       --db-subnet-group-name razorrecover-production-db-subnet
     ```
  3. Re-point ECS tasks by updating `DATABASE_URL` in AWS Secrets Manager.
  4. Perform sanity checks against `/api/health` and verify ledger reconciliation.
  - **RPO**: < 5 minutes (continuous WAL shipping).
  - **RTO**: ~20 minutes.

### Scenario C: Complete Regional Outage (`ap-south-1`)
- **Impact**: Catastrophic regional network disconnection.
- **Recovery Procedure**:
  1. Terraform IaC scripts (`infrastructure/terraform/`) can be initialized in backup region `ap-southeast-1` (Singapore).
  2. S3 Audit Archive bucket cross-region replication (CRR) provides historical state.
  3. Recreate RDS instance from the latest cross-region snapshot copy.
  4. Update Route 53 DNS records to point to the new regional ALB.
  - **RPO**: < 1 hour.
  - **RTO**: < 45 minutes.

---

## 3. Semi-Annual Tabletop & Failover Drills

1. **Drill Frequency**: Bi-annual scheduled drill in staging.
2. **Procedure**:
   - Force RDS failover via `aws rds reboot-db-instance --force-failover`.
   - Validate continuous webhook acceptance via SQS queue buffer during DB reboot.
   - Verify zero unhandled payment drops or duplicate ledger credits.

