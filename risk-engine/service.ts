import { AppMode, PrismaClient } from '@prisma/client';
import {
  classifyFailure,
  isCheckoutAbandonment,
  isSubscriptionFailure,
  scorePaymentRisk,
} from './classifier';
import type { RevenueRiskItem, RevenueRiskSummary } from './types';

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function horizon(hours: number): RevenueRiskItem['timeHorizon'] {
  return hours <= 24 ? '0-24h' : hours <= 168 ? '1-7d' : '7d+';
}

export async function getRevenueRisk(
  client: PrismaClient,
  merchantId: string,
): Promise<RevenueRiskSummary> {
  const merchant = await client.merchant.findUnique({
    where: { id: merchantId },
    select: { mode: true },
  });
  const predictionLabel =
    merchant?.mode === AppMode.DEMO ? 'DEMO PREDICTION' : 'DETERMINISTIC RULE OUTPUT';
  const attempts = await client.paymentAttempt.findMany({
    where: { merchantId, isDeleted: false, status: { in: ['FAILED', 'PENDING', 'EXPIRED'] } },
    include: { payment: { include: { customer: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  const now = Date.now();
  const items: RevenueRiskItem[] = attempts.map((attempt) => {
    const metadata = metadataRecord(attempt.metadata);
    const customerMetadata = metadataRecord(attempt.payment?.customer?.metadata);
    const reason =
      typeof metadata.failureReason === 'string'
        ? metadata.failureReason
        : (attempt.gatewayResponseCode ?? 'unknown');
    const classification = classifyFailure(reason, attempt.status);
    const hours = Math.max(0, (now - attempt.createdAt.getTime()) / 3_600_000);
    const score = scorePaymentRisk({
      amount: attempt.amount.toFixed(2),
      failureReason: reason,
      classification,
      customerLifetimeValue:
        typeof customerMetadata.lifetimeValue === 'string'
          ? customerMetadata.lifetimeValue
          : undefined,
      isSubscription: isSubscriptionFailure(metadata),
      hoursSinceAttempt: hours,
    });
    const customerSegment = customerMetadata.segment === 'high_value' ? 'high_value' : 'standard';
    return {
      ...score,
      predictionLabel,
      amount: attempt.amount.toFixed(2),
      numberOfTransactions: 1,
      customerSegment,
      failureReason: reason,
      timeHorizon: horizon(hours),
    };
  });
  const totalCents = items.reduce((sum, item) => sum + Math.round(Number(item.amount) * 100), 0);
  const averageScore =
    items.length === 0
      ? 0
      : Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length);
  const averageProbability =
    items.length === 0
      ? 0
      : Math.round(items.reduce((sum, item) => sum + item.recoveryProbability, 0) / items.length);
  return {
    amount: (totalCents / 100).toFixed(2),
    numberOfTransactions: items.length,
    customerSegment: items.some((item) => item.customerSegment === 'high_value')
      ? 'high_value_and_standard'
      : 'standard',
    failureReason: 'See item-level contributing factors',
    riskScore: averageScore,
    timeHorizon: '0-24h through 7d+',
    recoveryProbability: averageProbability,
    predictionLabel,
    items,
  };
}

export { classifyFailure, isCheckoutAbandonment, isSubscriptionFailure, scorePaymentRisk };
