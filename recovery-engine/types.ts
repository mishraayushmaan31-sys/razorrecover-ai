export const RECOVERY_STRATEGIES = [
  'RETRY',
  'PAYMENT_LINK',
  'ALTERNATIVE_PAYMENT_METHOD',
  'REMINDER',
  'PERSONALIZED_MESSAGE',
  'HUMAN_ASSISTANCE',
  'DO_NOTHING',
] as const;

export type RecoveryStrategy = (typeof RECOVERY_STRATEGIES)[number];
export type RecoveryRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type RecoveryOpportunityInput = {
  id: string;
  amount: string;
  riskScore: number;
  recoveryProbability?: number;
  customersAffected?: number;
  failureClassification?: 'failed' | 'retryable' | 'abandoned' | 'successful';
  customerSegment?: 'high_value' | 'standard';
};

export type RecoveryProjection = {
  strategy: RecoveryStrategy;
  expectedRecovery: string;
  recoveryProbability: number;
  risk: RecoveryRisk;
  cost: string;
  roi: string;
  customersAffected: number;
  timeToRecovery: string;
  rationale: string;
};

export type WhatIfResult = {
  opportunityId: string;
  label: 'SIMULATION ONLY';
  sideEffectFree: true;
  projections: RecoveryProjection[];
};
