import type { MerchantPolicy, PolicyEvaluation, RecoveryActionRequest } from './types';

const DEFAULT_POLICY: MerchantPolicy = {
  maximumRetries: 3,
  maximumAutomaticRecoveryAmount: '50000.00',
  maximumCustomerContact: 3,
  blockHighRiskTransactions: true,
  approvalThreshold: '10000.00',
  lowConfidenceThreshold: 0.8,
  stopAfterSuccess: true,
  dailyRecoveryLimit: '100000.00',
};

function amount(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Invalid monetary policy value');
  return parsed;
}

export function defaultMerchantPolicy(): MerchantPolicy {
  return { ...DEFAULT_POLICY };
}

export function evaluatePolicy(
  request: RecoveryActionRequest,
  policy: MerchantPolicy = DEFAULT_POLICY,
  killSwitchActive = false,
): PolicyEvaluation {
  const reasons: string[] = [];
  if (
    killSwitchActive &&
    request.automatic &&
    request.action !== 'DO_NOTHING' &&
    request.action !== 'HUMAN_ASSISTANCE'
  )
    reasons.push('AI kill switch disables automatic recovery actions.');
  if (request.retryCount >= policy.maximumRetries)
    reasons.push(`Maximum retries (${policy.maximumRetries}) reached.`);
  if (request.automatic && amount(request.amount) > amount(policy.maximumAutomaticRecoveryAmount))
    reasons.push('Automatic recovery amount exceeds merchant limit.');
  if (
    request.customerContactCount >= policy.maximumCustomerContact &&
    ['REMINDER', 'PERSONALIZED_MESSAGE', 'PAYMENT_LINK'].includes(request.action)
  )
    reasons.push('Maximum customer contact limit reached.');
  if (policy.blockHighRiskTransactions && request.riskScore >= 80)
    reasons.push('High-risk transaction is blocked by policy.');
  if (policy.stopAfterSuccess && request.hasSuccessfulRecovery)
    reasons.push('Recovery stops after success by policy.');
  if (
    amount(request.dailyRecoveredAmount) + amount(request.amount) >
    amount(policy.dailyRecoveryLimit)
  )
    reasons.push('Daily recovery limit would be exceeded.');
  if (reasons.length > 0) return { decision: 'BLOCK', state: 'POLICY_BLOCKED', reasons };
  if (
    amount(request.amount) >= amount(policy.approvalThreshold) ||
    request.confidence < policy.lowConfidenceThreshold
  )
    return {
      decision: 'REQUIRE_REVIEW',
      state: 'NEEDS_APPROVAL',
      reasons: [
        amount(request.amount) >= amount(policy.approvalThreshold)
          ? 'Amount meets approval threshold.'
          : 'Confidence is below merchant threshold.',
      ],
    };
  return {
    decision: 'ALLOW',
    state: 'RECOMMENDED',
    reasons: ['Action satisfies merchant policy.'],
  };
}
