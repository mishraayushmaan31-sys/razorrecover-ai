export type RecoveryActionState =
  | 'RECOMMENDED'
  | 'POLICY_BLOCKED'
  | 'RISK_BLOCKED'
  | 'NEEDS_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type RecoveryActionKind =
  | 'PAYMENT_RETRY'
  | 'PAYMENT_LINK'
  | 'ALTERNATIVE_PAYMENT'
  | 'REMINDER'
  | 'PERSONALIZED_MESSAGE'
  | 'HUMAN_ASSISTANCE'
  | 'DO_NOTHING';

export type MerchantPolicy = {
  maximumRetries: number;
  maximumAutomaticRecoveryAmount: string;
  maximumCustomerContact: number;
  blockHighRiskTransactions: boolean;
  approvalThreshold: string;
  lowConfidenceThreshold: number;
  stopAfterSuccess: boolean;
  dailyRecoveryLimit: string;
};

export type RecoveryActionRequest = {
  actionId: string;
  action: RecoveryActionKind;
  amount: string;
  riskScore: number;
  confidence: number;
  retryCount: number;
  customerContactCount: number;
  dailyRecoveredAmount: string;
  hasSuccessfulRecovery: boolean;
  automatic: boolean;
};

export type PolicyEvaluation = {
  decision: 'ALLOW' | 'REQUIRE_REVIEW' | 'BLOCK';
  state: Extract<RecoveryActionState, 'RECOMMENDED' | 'POLICY_BLOCKED' | 'NEEDS_APPROVAL'>;
  reasons: string[];
};
