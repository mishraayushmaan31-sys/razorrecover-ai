import { PrismaClient } from '@prisma/client';
import { defaultMerchantPolicy } from './engine';
import type { MerchantPolicy } from './types';

function rulesObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function loadMerchantPolicy(
  client: PrismaClient,
  merchantId: string,
): Promise<MerchantPolicy> {
  const record = await client.policy.findFirst({
    where: { merchantId, isActive: true, isDeleted: false },
    orderBy: [{ version: 'desc' }, { updatedAt: 'desc' }],
    select: { rules: true },
  });
  const defaults = defaultMerchantPolicy();
  const rules = rulesObject(record?.rules);
  const numberRule = (key: string, fallback: number) =>
    typeof rules[key] === 'number' && Number.isFinite(rules[key])
      ? (rules[key] as number)
      : fallback;
  const moneyRule = (key: string, fallback: string) =>
    typeof rules[key] === 'string' && /^\d+(\.\d{1,2})?$/.test(rules[key] as string)
      ? (rules[key] as string)
      : fallback;
  const booleanRule = (key: string, fallback: boolean) =>
    typeof rules[key] === 'boolean' ? (rules[key] as boolean) : fallback;
  return {
    maximumRetries: numberRule('maximumRetries', numberRule('maxRetries', defaults.maximumRetries)),
    maximumAutomaticRecoveryAmount: moneyRule(
      'maximumAutomaticRecoveryAmount',
      defaults.maximumAutomaticRecoveryAmount,
    ),
    maximumCustomerContact: numberRule('maximumCustomerContact', defaults.maximumCustomerContact),
    blockHighRiskTransactions: booleanRule(
      'blockHighRiskTransactions',
      defaults.blockHighRiskTransactions,
    ),
    approvalThreshold: moneyRule('approvalThreshold', defaults.approvalThreshold),
    lowConfidenceThreshold: numberRule('lowConfidenceThreshold', defaults.lowConfidenceThreshold),
    stopAfterSuccess: booleanRule('stopAfterSuccess', defaults.stopAfterSuccess),
    dailyRecoveryLimit: moneyRule('dailyRecoveryLimit', defaults.dailyRecoveryLimit),
  };
}
