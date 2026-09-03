import { describe, expect, it } from 'vitest';
import {
  detectRevenueIncident,
  formatINR,
} from '../src/server/services/incident-detection-service';

describe('Prompt 19: Revenue Incident Detection', () => {
  it('detects abnormal payment degradation, failure-rate spikes, revenue impact, and customer-segment impact', () => {
    const result = detectRevenueIncident({
      normalSuccessRate: 96.4,
      currentSuccessRate: 78.1,
      normalFailureRate: 3.6,
      currentFailureRate: 21.9,
      revenueImpact: 642800,
      affectedSegment: 'HDFC & ICICI Netbanking / High-Value Subscriptions',
    });

    expect(result.isAbnormal).toBe(true);
    expect(result.status).toBe('ACTIVE');
    expect(result.detectedAnomaliesCount).toBe(4);

    // Verify abnormal signal types detected
    const signalTypes = result.abnormalSignals.map((s) => s.type);
    expect(signalTypes).toContain('PAYMENT_DEGRADATION');
    expect(signalTypes).toContain('FAILURE_RATE_SPIKE');
    expect(signalTypes).toContain('REVENUE_IMPACT');
    expect(signalTypes).toContain('CUSTOMER_SEGMENT_IMPACT');

    // Verify payment degradation details
    const degradationSignal = result.abnormalSignals.find((s) => s.type === 'PAYMENT_DEGRADATION');
    expect(degradationSignal?.detected).toBe(true);
    expect(degradationSignal?.severity).toBe('CRITICAL');
    expect(degradationSignal?.metric).toBe('96.4% → 78.1%');

    // Verify failure-rate spike details
    const spikeSignal = result.abnormalSignals.find((s) => s.type === 'FAILURE_RATE_SPIKE');
    expect(spikeSignal?.detected).toBe(true);
    expect(spikeSignal?.metric).toBe('3.6% → 21.9%');

    // Verify revenue impact details
    const revenueSignal = result.abnormalSignals.find((s) => s.type === 'REVENUE_IMPACT');
    expect(revenueSignal?.detected).toBe(true);
    expect(revenueSignal?.severity).toBe('CRITICAL');

    // Verify segment impact
    const segmentSignal = result.abnormalSignals.find((s) => s.type === 'CUSTOMER_SEGMENT_IMPACT');
    expect(segmentSignal?.detected).toBe(true);
    expect(segmentSignal?.metric).toBe('HDFC & ICICI Netbanking / High-Value Subscriptions');
  });

  it('displays the required fields: Normal Failure Rate, Current Failure Rate, Revenue Impact, Affected Segment, AI Confidence, Recommended Mitigation', () => {
    const result = detectRevenueIncident();

    // 1. Normal Failure Rate
    expect(result.normalFailureRate).toBe('3.6%');
    expect(result.normalFailureRateValue).toBe(3.6);

    // 2. Current Failure Rate
    expect(result.currentFailureRate).toBe('21.9%');
    expect(result.currentFailureRateValue).toBe(21.9);

    // 3. Revenue Impact
    expect(result.revenueImpact).toContain('6,42,800');
    expect(result.revenueImpactValue).toBe(642800);

    // 4. Affected Segment
    expect(result.affectedSegment).toBe('HDFC & ICICI Netbanking / High-Value Subscriptions');

    // 5. AI Confidence
    expect(result.aiConfidence).toBe(94);
    expect(result.aiConfidenceDisplay).toBe('94%');

    // 6. Recommended Mitigation
    expect(result.recommendedMitigation).toBeTruthy();
    expect(result.recommendedMitigation.toLowerCase()).toContain('reroute');
    expect(result.recommendedMitigation.toLowerCase()).toContain('smart retry');
  });

  it('correctly reports healthy state when telemetry is within normal tolerances', () => {
    const normalResult = detectRevenueIncident({
      normalSuccessRate: 96.5,
      currentSuccessRate: 96.2,
      normalFailureRate: 3.5,
      currentFailureRate: 3.8,
      revenueImpact: 12000,
      affectedSegment: 'Standard Retail Checkout',
    });

    expect(normalResult.isAbnormal).toBe(false);
    expect(normalResult.status).toBe('MONITORING');
    expect(normalResult.detectedAnomaliesCount).toBe(0);
  });

  it('formats Indian rupee currency correctly', () => {
    const formatted = formatINR(642800);
    expect(formatted).toContain('6,42,800');
  });
});
