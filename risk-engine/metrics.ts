import type { FailureClassification, RiskEvaluationMetrics } from './types';

export type EvaluationCase = {
  actual: FailureClassification;
  predicted: FailureClassification;
  highValue: boolean;
};

export function evaluateRiskClassifier(cases: EvaluationCase[]): RiskEvaluationMetrics {
  const evaluated = cases.length;
  const trueRetryable = cases.filter((item) => item.actual === 'retryable').length;
  const predictedRetryable = cases.filter((item) => item.predicted === 'retryable').length;
  const correctRetryable = cases.filter(
    (item) => item.actual === 'retryable' && item.predicted === 'retryable',
  ).length;
  const actualAbandoned = cases.filter((item) => item.actual === 'abandoned').length;
  const correctAbandoned = cases.filter(
    (item) => item.actual === 'abandoned' && item.predicted === 'abandoned',
  ).length;
  const highValue = cases.filter((item) => item.highValue).length;

  return {
    evaluated,
    retryablePrecision: predictedRetryable === 0 ? 0 : correctRetryable / predictedRetryable,
    retryableRecall: trueRetryable === 0 ? 0 : correctRetryable / trueRetryable,
    abandonmentDetectionRate: actualAbandoned === 0 ? 0 : correctAbandoned / actualAbandoned,
    highValueCoverage:
      highValue === 0
        ? 0
        : cases.filter((item) => item.highValue && item.predicted !== 'successful').length /
          highValue,
    calibrationNote:
      'Evaluation metrics describe deterministic demo/rule behavior only; they are not production ML validation.',
  };
}
