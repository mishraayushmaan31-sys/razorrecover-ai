import { describe, expect, it } from 'vitest';
import {
  classifyFailure,
  isCheckoutAbandonment,
  isSubscriptionFailure,
  scorePaymentRisk,
} from '../risk-engine';
import { evaluateRiskClassifier } from '../risk-engine/metrics';

describe('revenue risk engine', () => {
  it('classifies terminal, retryable, abandoned, and successful outcomes', () => {
    expect(classifyFailure('network_timeout', 'FAILED')).toBe('retryable');
    expect(classifyFailure('customer_abandoned', 'EXPIRED')).toBe('abandoned');
    expect(classifyFailure('bank_declined', 'FAILED')).toBe('failed');
    expect(classifyFailure('success', 'CAPTURED')).toBe('successful');
  });

  it('detects checkout abandonment and subscription failures from structured evidence', () => {
    expect(
      isCheckoutAbandonment(undefined, { checkoutStarted: true, checkoutCompleted: false }),
    ).toBe(true);
    expect(isCheckoutAbandonment('customer_abandoned')).toBe(true);
    expect(isSubscriptionFailure({ paymentType: 'subscription' })).toBe(true);
    expect(isSubscriptionFailure({ paymentType: 'one_time' })).toBe(false);
  });

  it('produces a bounded explainable score with recovery probability', () => {
    const result = scorePaymentRisk({
      amount: '15000.00',
      failureReason: 'network_timeout',
      classification: 'retryable',
      customerLifetimeValue: '150000.00',
      isSubscription: true,
      hoursSinceAttempt: 12,
    });
    expect(result.score).toBe(71);
    expect(result.level).toBe('HIGH');
    expect(result.recoveryProbability).toBe(72);
    expect(result.predictionLabel).toBe('DETERMINISTIC RULE OUTPUT');
    expect(result.factors.map((factor) => factor.name)).toEqual([
      'retryable_failure',
      'subscription_failure',
      'high_value_amount',
      'high_value_customer',
    ]);
    expect(result.factors.every((factor) => factor.explanation.length > 0)).toBe(true);
  });

  it('calculates transparent evaluation metrics without calling them ML validation', () => {
    const metrics = evaluateRiskClassifier([
      { actual: 'retryable', predicted: 'retryable', highValue: true },
      { actual: 'retryable', predicted: 'failed', highValue: false },
      { actual: 'abandoned', predicted: 'abandoned', highValue: true },
      { actual: 'failed', predicted: 'failed', highValue: false },
    ]);
    expect(metrics.evaluated).toBe(4);
    expect(metrics.retryablePrecision).toBe(1);
    expect(metrics.retryableRecall).toBe(0.5);
    expect(metrics.abandonmentDetectionRate).toBe(1);
    expect(metrics.calibrationNote).toContain('not production ML validation');
  });
});
