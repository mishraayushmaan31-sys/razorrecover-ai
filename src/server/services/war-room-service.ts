import { PrismaClient } from '@prisma/client';
import { formatINR } from './incident-detection-service';

export type WarRoomIncidentState = 'INVESTIGATING' | 'ACTIVE_MITIGATION' | 'RESOLVED';

export type TimelineItem = {
  id: string;
  timeOffset: string; // e.g. "T-25m", "T-15m"
  timestamp: string;
  title: string;
  description: string;
  category: 'DETECTION' | 'DIAGNOSIS' | 'POLICY_GATE' | 'MITIGATION' | 'ESCALATION' | 'RESOLUTION';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
};

export type InvestigationTelemetry = {
  id: string;
  timestamp: string;
  node: string;
  signal: string;
  status: 'NORMAL' | 'DEGRADED' | 'CRITICAL' | 'RECOVERED';
  latency: string;
  errorRate: string;
  finding: string;
};

export type ActionEntry = {
  id: string;
  title: string;
  description: string;
  category: 'RECOVERY' | 'BLOCKED' | 'ESCALATION' | 'UNSAFE';
  status: 'EXECUTED' | 'QUEUED' | 'BLOCKED' | 'ACKNOWLEDGED' | 'COMPLETED';
  executedBy?: string;
  reason?: string;
  amount?: string;
  timestamp: string;
};

export type ResolvedIncidentMetrics = {
  statusHeader: 'INCIDENT RESOLVED';
  revenueRescued: string; // e.g. "₹5,84,200"
  revenueRescuedAmount: number; // 584200
  recoveryRate: string; // "90.9%"
  recoveryRateValue: number; // 90.9
  automaticActions: number; // 14
  automaticActionsSummary: string[];
  humanEscalations: number; // 2
  humanEscalationsSummary: string[];
  blockedActions: number; // 4
  blockedActionsSummary: string[];
  unsafeActions: number; // 1
  unsafeActionsSummary: string[];
  resolvedAt: string;
  resolvedBy: string;
  postMortemSummary: string;
};

export type WarRoomDetails = {
  incidentId: string;
  incidentNumber: number; // 1042
  title: string;
  severity: 'CRITICAL';
  status: WarRoomIncidentState;
  isResolved: boolean;
  paymentSuccess: {
    normal: string; // "96.4%"
    current: string; // "78.1%"
    change: string; // "-18.3%"
    normalValue: number;
    currentValue: number;
  };
  failureRate: {
    normal: string; // "3.6%"
    current: string; // "21.9%"
    surgeMultiplier: string; // "6.1x"
  };
  revenueAtRisk: string; // "₹6,42,800"
  revenueAtRiskAmount: number; // 642800
  aiConfidence: number; // 94
  aiConfidenceDisplay: string; // "94%"
  affectedSegment: string;
  rootCause: string;
  liveInvestigation: {
    activeAgentsCount: number;
    lastCheckedAt: string;
    telemetry: InvestigationTelemetry[];
    logs: string[];
  };
  timeline: TimelineItem[];
  recoveryActions: ActionEntry[];
  blockedActions: ActionEntry[];
  humanEscalations: ActionEntry[];
  unsafeActions: ActionEntry[];
  resolution?: ResolvedIncidentMetrics;
};

// In-memory state store for interactive resolution demo per merchant
const warRoomStore = new Map<string, { isResolved: boolean; resolvedAt?: string }>();

export function getCanonicalWarRoomData(isResolved = false, resolvedAt?: string): WarRoomDetails {
  const normalSuccess = 96.4;
  const currentSuccess = isResolved ? 95.8 : 78.1;
  const normalFailure = 3.6;
  const currentFailure = isResolved ? 4.2 : 21.9;
  const atRisk = 642800;
  const rescued = 584200;
  const recoveryRate = ((rescued / atRisk) * 100).toFixed(1); // 90.9%

  const timeline: TimelineItem[] = [
    {
      id: 'evt-1',
      timeOffset: 'T-25m',
      timestamp: '12:42:15 UTC',
      title: 'Baseline Degradation Detected',
      description: 'Payment gateway telemetry registered initial 4.8% success drop on HDFC Netbanking endpoint.',
      category: 'DETECTION',
      severity: 'WARNING',
    },
    {
      id: 'evt-2',
      timeOffset: 'T-20m',
      timestamp: '12:47:03 UTC',
      title: 'Failure-Rate Spike Trigger (#1042 Standing Up)',
      description: 'Failure rate spiked from normal baseline 3.6% to 21.9%. Revenue at risk breached ₹5,00,000 threshold. AI Revenue War Room automatically initiated.',
      category: 'DETECTION',
      severity: 'CRITICAL',
    },
    {
      id: 'evt-3',
      timeOffset: 'T-15m',
      timestamp: '12:52:19 UTC',
      title: 'AI Diagnostic Agent Pinpoints Root Cause',
      description: 'Identified HDFC Netbanking 504 Gateway Timeouts and Webhook acknowledgement latency surging beyond 8.2s causing cascade drops.',
      category: 'DIAGNOSIS',
      severity: 'CRITICAL',
    },
    {
      id: 'evt-4',
      timeOffset: 'T-12m',
      timestamp: '12:55:40 UTC',
      title: 'Policy Gate POL-RETRY-02 Evaluated',
      description: 'Deterministic policy verified mitigation plan. Permitted secondary rail rerouting; blocked zero-delay retry storms.',
      category: 'POLICY_GATE',
      severity: 'INFO',
    },
    {
      id: 'evt-5',
      timeOffset: 'T-10m',
      timestamp: '12:57:12 UTC',
      title: 'Automated Mitigations Dispatched',
      description: 'Smart routing switched 82% of netbanking traffic to backup Razorpay rail. Dynamic retry queue initialized with 15-minute jitter.',
      category: 'MITIGATION',
      severity: 'INFO',
    },
    {
      id: 'evt-6',
      timeOffset: 'T-06m',
      timestamp: '13:01:45 UTC',
      title: 'Human Review Escalations Assigned',
      description: 'Ticket #HR-1042 routed to On-Call Treasury & Gateway Ops for manual rail rate-limit bump approval.',
      category: 'ESCALATION',
      severity: 'WARNING',
    },
    {
      id: 'evt-7',
      timeOffset: isResolved ? 'T-00m' : 'T-02m',
      timestamp: isResolved ? (resolvedAt ? new Date(resolvedAt).toTimeString().split(' ')[0] + ' UTC' : '13:08:12 UTC') : '13:06:00 UTC',
      title: isResolved ? 'Incident Resolved – Recovery Verified' : 'Stabilization In Progress',
      description: isResolved
        ? 'All degraded transactions re-routed or retried. Payment success rate restored to 95.8%. ₹5,84,200 rescued.'
        : 'Mitigations holding; monitoring gateway acknowledgement p99 latency.',
      category: isResolved ? 'RESOLUTION' : 'MITIGATION',
      severity: isResolved ? 'SUCCESS' : 'INFO',
    },
  ];

  const telemetry: InvestigationTelemetry[] = [
    {
      id: 'tel-1',
      timestamp: 'Just now',
      node: 'HDFC Netbanking Gateway Node-04',
      signal: 'HTTP 504 Gateway Timeouts',
      status: isResolved ? 'RECOVERED' : 'CRITICAL',
      latency: isResolved ? '210ms' : '8,420ms (Surge 41x)',
      errorRate: isResolved ? '1.8%' : '74.2% timeout rate',
      finding: 'Upstream bank switch degradation; timeouts causing cascade retries',
    },
    {
      id: 'tel-2',
      timestamp: 'Just now',
      node: 'Webhook Ingestion Pipeline',
      signal: 'Ack Latency Spike',
      status: isResolved ? 'NORMAL' : 'DEGRADED',
      latency: isResolved ? '145ms' : '9,120ms (Normal <200ms)',
      errorRate: isResolved ? '0.2%' : '18.4% queue backpressure',
      finding: 'Pending authorization callbacks exceeding client timeout threshold',
    },
    {
      id: 'tel-3',
      timestamp: 'Just now',
      node: 'Razorpay Backup Routing Rail',
      signal: 'Secondary Fallback Rail',
      status: 'NORMAL',
      latency: '185ms',
      errorRate: '0.9%',
      finding: 'Backup rail active; handling diverted checkout traffic cleanly',
    },
    {
      id: 'tel-4',
      timestamp: 'Just now',
      node: 'High-Value Customer Churn Monitor',
      signal: 'VIP Recurring Debit',
      status: isResolved ? 'NORMAL' : 'DEGRADED',
      latency: '240ms',
      errorRate: isResolved ? '0.5%' : '31.2% first-attempt drops',
      finding: '140 high-value subscription accounts sheltered in delayed retry bucket',
    },
  ];

  const recoveryActions: ActionEntry[] = [
    {
      id: 'act-rec-1',
      title: 'Dynamic Gateway Rail Failover',
      description: 'Rerouted 82% of netbanking and UPI traffic away from degraded HDFC node to secondary Razorpay fallback rail.',
      category: 'RECOVERY',
      status: 'EXECUTED',
      executedBy: 'AI Mitigation Controller',
      amount: '₹4,12,000',
      timestamp: '12:57:15 UTC',
    },
    {
      id: 'act-rec-2',
      title: 'Smart Retry Engine with 15m Exponential Jitter',
      description: 'Scheduled batch retries for 412 transient 504 drops with backoff window to prevent gateway hammering.',
      category: 'RECOVERY',
      status: isResolved ? 'COMPLETED' : 'EXECUTED',
      executedBy: 'Deterministic Recovery Engine',
      amount: '₹1,42,200',
      timestamp: '12:58:30 UTC',
    },
    {
      id: 'act-rec-3',
      title: 'VIP Fallback Payment Links Dispatched',
      description: 'Generated secure payment retry links sent via SMS/WhatsApp to 84 high-value subscription customers.',
      category: 'RECOVERY',
      status: 'EXECUTED',
      executedBy: 'Customer Recovery Agent',
      amount: '₹30,000',
      timestamp: '13:02:10 UTC',
    },
    {
      id: 'act-rec-4',
      title: 'Automated Cart Session Extension',
      description: 'Extended checkout session expiry from 15m to 60m for impacted enterprise checkouts.',
      category: 'RECOVERY',
      status: 'EXECUTED',
      executedBy: 'Session Guard',
      timestamp: '13:03:00 UTC',
    },
  ];

  const blockedActions: ActionEntry[] = [
    {
      id: 'act-blk-1',
      title: 'Zero-Delay Aggressive Payment Retries',
      description: 'Halted immediate continuous retries that would trigger gateway IP rate-limiting and customer card locks.',
      category: 'BLOCKED',
      status: 'BLOCKED',
      reason: 'Violates Policy POL-RETRY-02 (Anti-Flapping Backoff Requirement)',
      timestamp: '12:53:10 UTC',
    },
    {
      id: 'act-blk-2',
      title: 'Direct Card Re-Debit Without 2FA Step-Up',
      description: 'Intercepted proposed automatic recurring charge re-attempt without mandatory RBI 2FA verification.',
      category: 'BLOCKED',
      status: 'BLOCKED',
      reason: 'Violates Policy POL-RISK-09 (RBI Two-Factor Authentication Compliance)',
      timestamp: '12:55:00 UTC',
    },
    {
      id: 'act-blk-3',
      title: 'Unverified Batch Re-Attempt Without Bank Sync',
      description: 'Blocked bulk execution until bank acknowledgement state could be verified via idempotency keys.',
      category: 'BLOCKED',
      status: 'BLOCKED',
      reason: 'Violates Safety Barrier: Idempotency Verification Required',
      timestamp: '12:56:22 UTC',
    },
    {
      id: 'act-blk-4',
      title: 'High-Value Account Auto-Downgrade',
      description: 'Blocked automated subscription cancellation for users whose recurring payment failed during the incident.',
      category: 'BLOCKED',
      status: 'BLOCKED',
      reason: 'Violates Policy POL-SUB-04 (Grace Period Protection for Outages)',
      timestamp: '13:00:15 UTC',
    },
  ];

  const humanEscalations: ActionEntry[] = [
    {
      id: 'act-esc-1',
      title: 'Ticket #HR-1042: Secondary Gateway Rail Limit Bump',
      description: 'Escalated to On-Call Treasury & Gateway Ops to approve rate-limit elevation from 500 TPS to 2,000 TPS.',
      category: 'ESCALATION',
      status: isResolved ? 'COMPLETED' : 'ACKNOWLEDGED',
      executedBy: 'Assigned to Ops Lead (K. Sharma)',
      timestamp: '13:01:45 UTC',
    },
    {
      id: 'act-esc-2',
      title: 'Ticket #HR-1043: Tier-1 Enterprise SLA Notification',
      description: 'Escalated to Merchant Success Lead for proactive notification of 12 enterprise accounts regarding gateway latency.',
      category: 'ESCALATION',
      status: isResolved ? 'COMPLETED' : 'ACKNOWLEDGED',
      executedBy: 'Assigned to Enterprise Support (R. Mehta)',
      timestamp: '13:04:10 UTC',
    },
  ];

  const unsafeActions: ActionEntry[] = [
    {
      id: 'act-uns-1',
      title: 'Unsafe Mass-Recharge Without Bank ACK',
      description: 'Proposed blind re-debiting of 230 simultaneous customer accounts without gateway acknowledgement receipt.',
      category: 'UNSAFE',
      status: 'BLOCKED',
      reason: 'Classified as UNSAFE: Extreme risk of double-charging customer bank accounts.',
      amount: '₹3,20,000',
      timestamp: '12:54:30 UTC',
    },
  ];

  const resolutionMetrics: ResolvedIncidentMetrics = {
    statusHeader: 'INCIDENT RESOLVED',
    revenueRescued: formatINR(rescued), // "₹5,84,200"
    revenueRescuedAmount: rescued,
    recoveryRate: `${recoveryRate}%`, // "90.9%"
    recoveryRateValue: Number(recoveryRate),
    automaticActions: 14,
    automaticActionsSummary: [
      '14 Automated Smart Reroutes & Intelligent Retries Executed',
      'Dynamic failover diverted 82% of volume to backup Razorpay rail',
      'Exponential jitter backoff prevented gateway flooding',
      '84 VIP checkout rescue links automatically generated and delivered',
    ],
    humanEscalations: 2,
    humanEscalationsSummary: [
      'Ticket #HR-1042: Gateway limit elevation verified and signed off by Ops Lead',
      'Ticket #HR-1043: Enterprise SLA notifications dispatched by Support Team',
    ],
    blockedActions: 4,
    blockedActionsSummary: [
      'Blocked aggressive zero-delay retry loop (POL-RETRY-02)',
      'Blocked card debit retry without mandatory 2FA step-up (POL-RISK-09)',
      'Blocked unverified batch attempt pending idempotency check',
      'Blocked subscription cancellation during active provider degradation',
    ],
    unsafeActions: 1,
    unsafeActionsSummary: [
      'Critical Safety Barrier: Blocked unsafe mass re-charge of 230 accounts without bank ACK receipt (₹3,20,000 prevented double-charge risk)',
    ],
    resolvedAt: resolvedAt ?? new Date().toISOString(),
    resolvedBy: 'AI Incident Orchestrator & On-Call Operations Team',
    postMortemSummary:
      'Payment success rate restored from 78.1% to 95.8%. Normal failure rate normalized from 21.9% to 4.2%. ₹5,84,200 rescued out of ₹6,42,800 total exposure.',
  };

  return {
    incidentId: 'inc-demo-01042',
    incidentNumber: 1042,
    title: 'REVENUE INCIDENT #1042 – HDFC Netbanking Degradation & High-Value Subscriptions',
    severity: 'CRITICAL',
    status: isResolved ? 'RESOLVED' : 'ACTIVE_MITIGATION',
    isResolved,
    paymentSuccess: {
      normal: `${normalSuccess.toFixed(1)}%`,
      current: `${currentSuccess.toFixed(1)}%`,
      change: isResolved ? '-0.6%' : `${(currentSuccess - normalSuccess).toFixed(1)}%`,
      normalValue: normalSuccess,
      currentValue: currentSuccess,
    },
    failureRate: {
      normal: `${normalFailure.toFixed(1)}%`,
      current: `${currentFailure.toFixed(1)}%`,
      surgeMultiplier: isResolved ? '1.1x' : '6.1x',
    },
    revenueAtRisk: formatINR(atRisk), // "₹6,42,800"
    revenueAtRiskAmount: atRisk,
    aiConfidence: 94,
    aiConfidenceDisplay: '94%',
    affectedSegment: 'HDFC & ICICI Netbanking / High-Value Subscriptions',
    rootCause:
      'HDFC Netbanking 504 Gateway Timeouts & Webhook acknowledgement latency > 8.2s causing cascade drops on Recurring Subscriptions and High-Value Checkouts.',
    liveInvestigation: {
      activeAgentsCount: isResolved ? 0 : 3,
      lastCheckedAt: new Date().toISOString(),
      telemetry,
      logs: [
        '[12:42:10] Anomaly detector detected 18.3% drop in HDFC netbanking authorizations.',
        '[12:45:00] p99 webhook acknowledgement latency surged from 145ms to 9,120ms.',
        '[12:52:19] Diagnostic agent confirmed HTTP 504 upstream gateway timeouts.',
        '[12:55:40] Policy check POL-RETRY-02 blocked aggressive immediate retry.',
        '[12:57:15] Secondary Razorpay failover routing initiated for 82% of netbanking traffic.',
        '[13:01:45] Ticket #HR-1042 routed to on-call ops for throughput ceiling increase.',
        isResolved
          ? '[13:08:12] INCIDENT RESOLVED: Success rate restored to 95.8%, ₹5,84,200 rescued.'
          : '[13:06:00] Active mitigation running: 412 smart retries scheduled in backoff queue.',
      ],
    },
    timeline,
    recoveryActions,
    blockedActions,
    humanEscalations,
    unsafeActions,
    resolution: isResolved ? resolutionMetrics : undefined,
  };
}

export async function getWarRoomDetails(
  client: PrismaClient,
  merchantId: string,
): Promise<WarRoomDetails> {
  void client;
  const record = warRoomStore.get(merchantId);
  return getCanonicalWarRoomData(record?.isResolved ?? false, record?.resolvedAt);
}

export async function resolveWarRoomIncident(
  client: PrismaClient,
  merchantId: string,
): Promise<WarRoomDetails> {
  void client;
  const resolvedAt = new Date().toISOString();
  warRoomStore.set(merchantId, { isResolved: true, resolvedAt });
  return getCanonicalWarRoomData(true, resolvedAt);
}

export async function resetWarRoomIncident(
  client: PrismaClient,
  merchantId: string,
): Promise<WarRoomDetails> {
  void client;
  warRoomStore.delete(merchantId);
  return getCanonicalWarRoomData(false);
}
