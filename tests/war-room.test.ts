import { describe, expect, it } from 'vitest';
import {
  getCanonicalWarRoomData,
} from '../src/server/services/war-room-service';

describe('Prompt 19: AI REVENUE WAR ROOM', () => {
  it('instantiates example incident REVENUE INCIDENT #1042 with required metrics', () => {
    const warRoom = getCanonicalWarRoomData(false);

    // Incident ID and Number
    expect(warRoom.incidentNumber).toBe(1042);
    expect(warRoom.title).toContain('REVENUE INCIDENT #1042');

    // Payment Success: 96.4% → 78.1%
    expect(warRoom.paymentSuccess.normal).toBe('96.4%');
    expect(warRoom.paymentSuccess.current).toBe('78.1%');
    expect(warRoom.paymentSuccess.change).toBe('-18.3%');

    // Revenue at Risk: ₹6,42,800
    expect(warRoom.revenueAtRisk).toContain('6,42,800');
    expect(warRoom.revenueAtRiskAmount).toBe(642800);

    // AI Confidence: 94%
    expect(warRoom.aiConfidence).toBe(94);
    expect(warRoom.aiConfidenceDisplay).toBe('94%');
  });

  it('shows live investigation telemetry and root cause', () => {
    const warRoom = getCanonicalWarRoomData(false);

    // Live investigation
    expect(warRoom.liveInvestigation.activeAgentsCount).toBeGreaterThan(0);
    expect(warRoom.liveInvestigation.telemetry.length).toBeGreaterThanOrEqual(3);
    expect(warRoom.liveInvestigation.logs.length).toBeGreaterThan(0);

    const gatewayNode = warRoom.liveInvestigation.telemetry.find((t) =>
      t.node.includes('HDFC Netbanking'),
    );
    expect(gatewayNode).toBeDefined();
    expect(gatewayNode?.status).toBe('CRITICAL');

    // Root cause
    expect(warRoom.rootCause).toBeTruthy();
    expect(warRoom.rootCause).toContain('HDFC Netbanking 504 Gateway Timeouts');
    expect(warRoom.rootCause).toContain('Webhook acknowledgement latency');
  });

  it('shows chronological timeline of incident events', () => {
    const warRoom = getCanonicalWarRoomData(false);

    expect(warRoom.timeline.length).toBeGreaterThanOrEqual(5);

    const categories = warRoom.timeline.map((t) => t.category);
    expect(categories).toContain('DETECTION');
    expect(categories).toContain('DIAGNOSIS');
    expect(categories).toContain('POLICY_GATE');
    expect(categories).toContain('MITIGATION');
    expect(categories).toContain('ESCALATION');

    // Check time offsets
    expect(warRoom.timeline[0].timeOffset).toBe('T-25m');
  });

  it('shows recovery actions, blocked actions, and human escalations', () => {
    const warRoom = getCanonicalWarRoomData(false);

    // Recovery actions
    expect(warRoom.recoveryActions.length).toBeGreaterThan(0);
    const failoverAction = warRoom.recoveryActions.find((a) =>
      a.title.includes('Dynamic Gateway Rail Failover'),
    );
    expect(failoverAction).toBeDefined();
    expect(failoverAction?.status).toBe('EXECUTED');

    // Blocked actions (prevented by policy & safety rules)
    expect(warRoom.blockedActions.length).toBeGreaterThanOrEqual(4);
    const zeroDelay = warRoom.blockedActions.find((a) =>
      a.title.includes('Zero-Delay Aggressive Payment Retries'),
    );
    expect(zeroDelay).toBeDefined();
    expect(zeroDelay?.reason).toContain('POL-RETRY-02');

    const cardDebit = warRoom.blockedActions.find((a) =>
      a.title.includes('Direct Card Re-Debit Without 2FA'),
    );
    expect(cardDebit).toBeDefined();
    expect(cardDebit?.reason).toContain('POL-RISK-09');

    // Human escalations
    expect(warRoom.humanEscalations.length).toBeGreaterThanOrEqual(2);
    const ticket1042 = warRoom.humanEscalations.find((a) =>
      a.title.includes('Ticket #HR-1042'),
    );
    expect(ticket1042).toBeDefined();
  });

  it('ends resolved incidents with exact required post-incident metrics', () => {
    const resolvedWarRoom = getCanonicalWarRoomData(true, '2026-09-03T13:08:12.000Z');

    expect(resolvedWarRoom.isResolved).toBe(true);
    expect(resolvedWarRoom.status).toBe('RESOLVED');
    expect(resolvedWarRoom.resolution).toBeDefined();

    const res = resolvedWarRoom.resolution!;

    // 1. INCIDENT RESOLVED header
    expect(res.statusHeader).toBe('INCIDENT RESOLVED');

    // 2. Revenue Rescued: ₹5,84,200
    expect(res.revenueRescued).toContain('5,84,200');
    expect(res.revenueRescuedAmount).toBe(584200);

    // 3. Recovery Rate: 90.9%
    expect(res.recoveryRate).toBe('90.9%');
    expect(res.recoveryRateValue).toBe(90.9);

    // 4. Automatic Actions: 14
    expect(res.automaticActions).toBe(14);
    expect(res.automaticActionsSummary.length).toBeGreaterThan(0);

    // 5. Human Escalations: 2
    expect(res.humanEscalations).toBe(2);
    expect(res.humanEscalationsSummary.length).toBe(2);

    // 6. Blocked Actions: 4
    expect(res.blockedActions).toBe(4);
    expect(res.blockedActionsSummary.length).toBe(4);

    // 7. Unsafe Actions: 1
    expect(res.unsafeActions).toBe(1);
    expect(res.unsafeActionsSummary.length).toBe(1);
    expect(res.unsafeActionsSummary[0]).toContain('unsafe mass re-charge');
  });
});

