# Monitoring, Alerting & Logging Architecture

This document describes the observability stack, metrics collection, log aggregation, and alerting rules configured for RazorRecover AI.

---

## 1. Metrics & Alarm Thresholds

| Metric                     | Target / Normal | Warning Threshold | Critical Alarm Threshold   | Action Triggered                                |
| :------------------------- | :-------------- | :---------------- | :------------------------- | :---------------------------------------------- |
| **API Target 5XX Count**   | 0 / min         | > 5 in 1 min      | > 10 in 2 consecutive mins | PagerDuty P0 alert; ECS autoscale investigation |
| **P99 API Latency**        | < 250 ms        | > 800 ms          | > 2,000 ms for 3 mins      | Ops notification; check database locks          |
| **Webhook DLQ Depth**      | 0               | > 0               | > 5 messages               | P1 on-call ticket; inspect payload error        |
| **RDS CPU Utilization**    | < 40%           | > 70%             | > 85% for 5 mins           | Add read replica or scale instance class        |
| **RDS Free Storage**       | > 50 GB         | < 20 GB           | < 10 GB                    | Storage autoscaling triggers up to 150 GB       |
| **ECS Memory Utilization** | < 60%           | > 75%             | > 85% for 3 mins           | ECS service autoscaler adds tasks               |
| **AI Degradation Surge**   | Baseline 3.6%   | > 8% failure      | > 15% failure rate         | War Room standing up; alert Ops Lead            |

---

## 2. Centralized Logging (`awslogs`)

1. **Log Stream Destination**: `/ecs/razorrecover-production` in Amazon CloudWatch.
2. **Log Format**: Structured JSON containing:
   - `level`: `info`, `warn`, `error`
   - `requestId`: UUID tracing the HTTP transaction across all layers
   - `merchantId`: Scoped identifier
   - `timestamp`: ISO-8601 UTC
   - `message`: Human-readable summary
   - `context`: Sanitized diagnostic metadata (passwords, tokens, and raw cards stripped)
3. **Metric Filters**:
   - `[timestamp, level="error", ...]` creates a custom CloudWatch metric `AppErrorCount` used by alerting rules.

---

## 3. On-Call Escalation Matrix

1. **Level 1 (Automated)**: CloudWatch Alarm triggers Amazon SNS topic `razorrecover-ops-alerts`.
2. **Level 2 (Human On-Call)**: SNS forwards to PagerDuty/Slack alerting On-Call Gateway Ops Engineer (15-minute response SLA).
3. **Level 3 (Executive / Treasury Escalation)**: If unacknowledged in 30 minutes, escalated to Operations Manager and VP Engineering.
