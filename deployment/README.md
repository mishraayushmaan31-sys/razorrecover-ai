# RazorRecover AI – Production Infrastructure & Deployment Architecture

This document evaluates the cloud infrastructure chosen for the RazorRecover AI Minimum Viable Product (MVP), justifying right-sized AWS services against over-engineering while enforcing financial safety and regulatory posture.

---

## 1. AWS Architecture Evaluation for MVP

| Component          | Selected AWS Service                | Architectural Rationale & Right-Sizing                                                                                                                                                                                                        |
| :----------------- | :---------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Edge & CDN**     | **Amazon CloudFront**               | Provides global low-latency edge TLS termination, DDoS shield, and HTTP/3 support. Specifically caches immutable Next.js static bundles (`/_next/static/*`) for 1 year while passing dynamic API and webhook traffic transparently to origin. |
| **DNS Routing**    | **Amazon Route 53**                 | Low-latency DNS routing with active health-checking against `/api/health`. Seamless alias records mapped to CloudFront.                                                                                                                       |
| **Web Security**   | **AWS WAFv2**                       | Protects the application boundary with AWSManagedRulesCommonRuleSet (OWASP Top 10), Amazon IP reputation lists, and an IP rate-limiting rule (100 req/min) to prevent brute-force attacks on webhook/login endpoints.                         |
| **Compute**        | **AWS ECS on Fargate**              | Serverless container execution. Eliminates EC2 patching and OS overhead. Configured with 0.5 vCPU and 1 GB RAM per task, autoscaling from 2 to 6 tasks across 2 Availability Zones for high availability.                                     |
| **Load Balancing** | **Application Load Balancer (ALB)** | Distributes traffic across private Fargate tasks with HTTPS termination, TLS 1.3 enforcement, and zero-downtime rolling health checks.                                                                                                        |
| **Database**       | **Amazon RDS PostgreSQL 16**        | Managed relational store with Multi-AZ automated failover, KMS storage encryption at rest, automated daily backups with 14-day point-in-time recovery (PITR), and private database subnets inaccessible from the internet.                    |
| **Cache & Locks**  | **Amazon ElastiCache Redis**        | `cache.t4g.small` single-node cluster used for distributed idempotency locks (preventing duplicate recovery action executions) and rate-limiting buckets.                                                                                     |
| **Queueing**       | **Amazon SQS FIFO**                 | Ensures strictly ordered, deduplicated webhook ingestion from payment gateways. Equipped with a Dead-Letter Queue (DLQ) with `maxReceiveCount = 3` to isolate poison-pill payloads without stalling the queue.                                |
| **Storage**        | **Amazon S3**                       | Encrypted bucket with object versioning and default AES-256 encryption for long-term audit trail exports, compliance logs, and explainability snapshots. Public access blocked completely.                                                    |
| **Monitoring**     | **Amazon CloudWatch**               | Centralized container logging (`awslogs`), metric alarms for 5xx errors and DLQ messages, and Container Insights for CPU/memory utilization tracking.                                                                                         |
| **Secrets**        | **AWS Secrets Manager**             | Centralized, KMS-encrypted storage for database URLs, JWT keys, and Razorpay API secrets with automated rotation support.                                                                                                                     |
| **Backups**        | **RDS Automated Backups + S3**      | 14-day automated WAL backups enabling point-in-time recovery down to the second.                                                                                                                                                              |

---

## 2. Infrastructure Directory Structure

```
infrastructure/
└── terraform/
    ├── main.tf                 # Complete AWS MVP resources
    ├── variables.tf            # Configurable inputs & defaults
    └── outputs.tf              # DNS, endpoints, and bucket names
```

## 3. Deployment Runbook

### Step 1: Provision Infrastructure

```bash
cd infrastructure/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### Step 2: Push Container Image to ECR

```bash
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com
docker build -t razorrecover:latest .
docker tag razorrecover:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/razorrecover:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/razorrecover:latest
```

### Step 3: Run Database Migrations

```bash
npx prisma migrate deploy
```

### Step 4: Deploy ECS Service

```bash
aws ecs update-service \
  --cluster razorrecover-production-cluster \
  --service razorrecover-production-service \
  --force-new-deployment
```

### Step 5: Verify Deployment Health

```bash
curl -f https://app.razorrecover.com/api/health
```
