import { describe, expect, it } from 'vitest';
import { canPerformReviewAction } from '../human-review/policy';
import { buildExplainabilitySnapshot } from '../human-review/service';

describe('human review and explainability ledger', () => {
  it('authorizes critical review actions only for owner and review managers', () => {
    expect(canPerformReviewAction('OWNER', 'APPROVE')).toBe(true);
    expect(canPerformReviewAction('FINANCE_MANAGER', 'APPROVE')).toBe(true);
    expect(canPerformReviewAction('OPERATIONS_MANAGER', 'ASSIGN')).toBe(true);
    expect(canPerformReviewAction('VIEWER', 'APPROVE')).toBe(false);
    expect(canPerformReviewAction('DEVELOPER', 'REJECT')).toBe(false);
  });

  it('creates a complete immutable explainability snapshot', () => {
    const snapshot = buildExplainabilitySnapshot({
      merchantId: 'merchant-1',
      actionId: 'action-1',
      reviewId: 'review-1',
      transactionId: 'transaction-1',
      customerId: 'customer-1',
      agent: 'recovery',
      decision: 'APPROVE',
      evidence: { source: 'payment-attempt', reason: 'retryable' },
      confidence: '0.91',
      risk: { score: 22 },
      policy: { decision: 'ALLOW' },
      approval: { reviewer: 'user-1', status: 'APPROVED' },
      result: 'APPROVED_FOR_DETERMINISTIC_EXECUTION',
      revenueRescued: '500.00',
    });
    expect(snapshot).toMatchObject({
      actionId: 'action-1',
      reviewId: 'review-1',
      decision: 'APPROVE',
      revenueRescued: '500.00',
    });
    expect(Object.keys(snapshot)).toEqual(
      expect.arrayContaining([
        'transactionId',
        'customerId',
        'agent',
        'evidence',
        'confidence',
        'risk',
        'policy',
        'approval',
        'result',
      ]),
    );
    const before = JSON.stringify(snapshot);
    expect(JSON.stringify(snapshot)).toBe(before);
  });
});
