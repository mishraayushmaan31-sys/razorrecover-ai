import type { FailureClassification, PaymentRiskInput, RiskFactor, RiskLevel } from './types';

const RETRYABLE_REASONS = new Set([
  'network_timeout',
  'gateway_timeout',
  'temporary_unavailable',
  'rate_limited',
]);
const ABANDONMENT_REASONS = new Set([
  'customer_abandoned',
  'checkout_abandoned',
  'session_expired',
]);

export function classifyFailure(reason?: string, status?: string): FailureClassification {
  const normalized = reason?.trim().toLowerCase();
  if (normalized && ABANDONMENT_REASONS.has(normalized)) return 'abandoned';
  if (normalized && RETRYABLE_REASONS.has(normalized)) return 'retryable';
  if (status === 'CAPTURED' || status === 'SUCCEEDED' || normalized === 'success')
    return 'successful';
  return 'failed';
}

export function isCheckoutAbandonment(
  reason?: string,
  metadata?: Record<string, unknown>,
): boolean {
  return (
    Boolean(metadata?.checkoutStarted && !metadata.checkoutCompleted) ||
    Boolean(reason && ABANDONMENT_REASONS.has(reason))
  );
}

export function isSubscriptionFailure(metadata?: Record<string, unknown>): boolean {
  return metadata?.paymentType === 'subscription' || metadata?.subscriptionId !== undefined;
}

export function scorePaymentRisk(input: PaymentRiskInput): {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  recoveryProbability: number;
  predictionLabel: 'DEMO PREDICTION' | 'DETERMINISTIC RULE OUTPUT';
} {
  const factors: RiskFactor[] = [];
  const add = (name: string, contribution: number, explanation: string) =>
    factors.push({ name, contribution, explanation });
  if (input.classification === 'failed')
    add('payment_failure', 35, 'Payment attempt has a terminal or unresolved failure reason.');
  if (input.classification === 'retryable')
    add('retryable_failure', 24, 'Failure reason is eligible for a controlled retry.');
  if (input.classification === 'abandoned')
    add('checkout_abandonment', 30, 'Checkout was started but no completed payment was observed.');
  if (isSubscriptionFailure({ paymentType: input.isSubscription ? 'subscription' : undefined }))
    add('subscription_failure', 12, 'Attempt is associated with recurring billing.');
  const amount = Number(input.amount);
  if (amount >= 10000)
    add('high_value_amount', 20, 'Amount meets the high-value threshold of INR 10,000.');
  else if (amount >= 5000)
    add('material_amount', 10, 'Amount is material to merchant recovery prioritization.');
  if (Number(input.customerLifetimeValue ?? 0) >= 100000)
    add('high_value_customer', 15, 'Customer lifetime value meets the high-value threshold.');
  if ((input.hoursSinceAttempt ?? 0) > 168)
    add('stale_opportunity', 8, 'Opportunity is older than the seven-day recovery horizon.');
  const score = Math.min(
    100,
    Math.max(
      0,
      factors.reduce((total, factor) => total + factor.contribution, 0),
    ),
  );
  const level: RiskLevel =
    score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';
  const recoveryProbability =
    input.classification === 'retryable'
      ? 72
      : input.classification === 'abandoned'
        ? 48
        : input.classification === 'failed'
          ? 24
          : 0;
  return {
    score,
    level,
    factors,
    recoveryProbability,
    predictionLabel: 'DETERMINISTIC RULE OUTPUT',
  };
}
