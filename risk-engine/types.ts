export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FailureClassification = 'failed' | 'retryable' | 'abandoned' | 'successful';

export type RiskFactor = {
  name: string;
  contribution: number;
  explanation: string;
};

export type PaymentRiskInput = {
  amount: string;
  failureReason?: string;
  classification: FailureClassification;
  customerLifetimeValue?: string;
  isSubscription?: boolean;
  hoursSinceAttempt?: number;
};

export type PaymentRiskScore = {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  recoveryProbability: number;
  predictionLabel: 'DEMO PREDICTION' | 'DETERMINISTIC RULE OUTPUT';
};

export type RevenueRiskItem = PaymentRiskScore & {
  amount: string;
  numberOfTransactions: number;
  customerSegment: 'high_value' | 'standard';
  failureReason: string;
  timeHorizon: '0-24h' | '1-7d' | '7d+';
};

export type RevenueRiskSummary = {
  amount: string;
  numberOfTransactions: number;
  customerSegment: string;
  failureReason: string;
  riskScore: number;
  timeHorizon: string;
  recoveryProbability: number;
  predictionLabel: 'DEMO PREDICTION' | 'DETERMINISTIC RULE OUTPUT';
  items: RevenueRiskItem[];
};

export type RiskEvaluationMetrics = {
  evaluated: number;
  retryablePrecision: number;
  retryableRecall: number;
  abandonmentDetectionRate: number;
  highValueCoverage: number;
  calibrationNote: string;
};
