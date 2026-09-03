import {
  RECOVERY_STRATEGIES,
  type RecoveryOpportunityInput,
  type RecoveryProjection,
  type RecoveryRisk,
  type RecoveryStrategy,
  type WhatIfResult,
} from './types';

type StrategyAssumption = {
  probabilityMultiplier: number;
  costRate: number;
  risk: RecoveryRisk;
  timeToRecovery: string;
  rationale: string;
};

const ASSUMPTIONS: Record<RecoveryStrategy, StrategyAssumption> = {
  RETRY: {
    probabilityMultiplier: 1,
    costRate: 0.01,
    risk: 'LOW',
    timeToRecovery: 'minutes',
    rationale: 'Controlled retry for retryable gateway failures.',
  },
  PAYMENT_LINK: {
    probabilityMultiplier: 0.72,
    costRate: 0.02,
    risk: 'LOW',
    timeToRecovery: 'hours',
    rationale: 'Send a hosted payment link for a fresh payment attempt.',
  },
  ALTERNATIVE_PAYMENT_METHOD: {
    probabilityMultiplier: 0.68,
    costRate: 0.025,
    risk: 'MEDIUM',
    timeToRecovery: 'hours',
    rationale: 'Offer an alternate payment rail when the primary rail failed.',
  },
  REMINDER: {
    probabilityMultiplier: 0.42,
    costRate: 0.005,
    risk: 'LOW',
    timeToRecovery: '1-2 days',
    rationale: 'Send a non-urgent payment reminder.',
  },
  PERSONALIZED_MESSAGE: {
    probabilityMultiplier: 0.55,
    costRate: 0.01,
    risk: 'LOW',
    timeToRecovery: 'hours-days',
    rationale: 'Use contextual messaging without moving money.',
  },
  HUMAN_ASSISTANCE: {
    probabilityMultiplier: 0.78,
    costRate: 0.12,
    risk: 'MEDIUM',
    timeToRecovery: '1-3 days',
    rationale: 'Route the customer to an operator for assisted recovery.',
  },
  DO_NOTHING: {
    probabilityMultiplier: 0,
    costRate: 0,
    risk: 'LOW',
    timeToRecovery: 'none',
    rationale: 'Observe without contacting or charging the customer.',
  },
};

function cents(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Invalid opportunity amount');
  return Math.round(parsed * 100);
}

function money(valueInCents: number): string {
  return (valueInCents / 100).toFixed(2);
}

function probabilityFor(strategy: RecoveryStrategy, input: RecoveryOpportunityInput): number {
  const baseline = Math.min(
    100,
    Math.max(
      0,
      input.recoveryProbability ??
        (input.failureClassification === 'retryable'
          ? 72
          : input.failureClassification === 'abandoned'
            ? 48
            : 24),
    ),
  );
  const classificationBoost =
    strategy === 'RETRY' && input.failureClassification === 'retryable'
      ? 1.15
      : strategy === 'REMINDER' && input.failureClassification === 'abandoned'
        ? 1.1
        : 1;
  return Math.min(
    95,
    Math.max(
      0,
      Math.round(baseline * ASSUMPTIONS[strategy].probabilityMultiplier * classificationBoost),
    ),
  );
}

export function projectRecovery(
  strategy: RecoveryStrategy,
  input: RecoveryOpportunityInput,
): RecoveryProjection {
  const amountCents = cents(input.amount);
  const assumptions = ASSUMPTIONS[strategy];
  const recoveryProbability = probabilityFor(strategy, input);
  const expectedRecoveryCents = Math.round((amountCents * recoveryProbability) / 100);
  const costCents = Math.round(amountCents * assumptions.costRate);
  const roi =
    costCents === 0 ? '0.00' : ((expectedRecoveryCents - costCents) / costCents).toFixed(2);
  return {
    strategy,
    expectedRecovery: money(expectedRecoveryCents),
    recoveryProbability,
    risk: input.riskScore >= 80 && strategy !== 'DO_NOTHING' ? 'HIGH' : assumptions.risk,
    cost: money(costCents),
    roi,
    customersAffected: input.customersAffected ?? 1,
    timeToRecovery: assumptions.timeToRecovery,
    rationale: assumptions.rationale,
  };
}

export function simulateRecovery(
  input: RecoveryOpportunityInput,
  strategies: RecoveryStrategy[] = [...RECOVERY_STRATEGIES],
): WhatIfResult {
  const uniqueStrategies = [...new Set(strategies)];
  if (uniqueStrategies.some((strategy) => !RECOVERY_STRATEGIES.includes(strategy)))
    throw new Error('Unsupported recovery strategy');
  return {
    opportunityId: input.id,
    label: 'SIMULATION ONLY',
    sideEffectFree: true,
    projections: uniqueStrategies.map((strategy) => projectRecovery(strategy, input)),
  };
}

export { ASSUMPTIONS };
