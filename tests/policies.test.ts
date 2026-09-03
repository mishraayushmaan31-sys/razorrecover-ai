import { describe, expect, it } from 'vitest';
import { defaultMerchantPolicy, evaluatePolicy } from '../policies/engine';
import { evaluateRiskGate } from '../policies/risk-gate';
import { canTransition, transitionAction } from '../policies/state-machine';

const base = {
  actionId: 'action-1',
  action: 'PAYMENT_RETRY' as const,
  amount: '1000.00',
  riskScore: 20,
  confidence: 0.95,
  retryCount: 0,
  customerContactCount: 0,
  dailyRecoveredAmount: '0.00',
  hasSuccessfulRecovery: false,
  automatic: true,
};

describe('policy engine and risk gate', () => {
  it('applies every default merchant safety limit', () => {
    const policy = defaultMerchantPolicy();
    expect(policy.maximumRetries).toBe(3);
    expect(policy.maximumAutomaticRecoveryAmount).toBe('50000.00');
    expect(policy.maximumCustomerContact).toBe(3);
    expect(policy.blockHighRiskTransactions).toBe(true);
    expect(policy.approvalThreshold).toBe('10000.00');
    expect(policy.lowConfidenceThreshold).toBe(0.8);
    expect(policy.stopAfterSuccess).toBe(true);
    expect(policy.dailyRecoveryLimit).toBe('100000.00');
  });

  it('blocks retries, contacts, high risk, success repeats, and daily limits', () => {
    const evaluation = evaluatePolicy({
      ...base,
      retryCount: 3,
      customerContactCount: 3,
      riskScore: 90,
      hasSuccessfulRecovery: true,
      dailyRecoveredAmount: '99500.00',
    });
    expect(evaluation.decision).toBe('BLOCK');
    expect(evaluation.state).toBe('POLICY_BLOCKED');
    expect(evaluation.reasons.length).toBeGreaterThanOrEqual(4);
  });

  it('requires approval for amount and low confidence thresholds', () => {
    const evaluation = evaluatePolicy({ ...base, amount: '10000.00', confidence: 0.5 });
    expect(evaluation.decision).toBe('REQUIRE_REVIEW');
    expect(evaluation.state).toBe('NEEDS_APPROVAL');
  });

  it('fails closed for critical risk and never authorizes execution', () => {
    const result = evaluateRiskGate({ ...base, riskScore: 80 });
    expect(result.state).toBe('POLICY_BLOCKED');
    expect(result.executionAuthorized).toBe(false);
    const lowRisk = evaluateRiskGate({ ...base, riskScore: 10 });
    expect(lowRisk.state).toBe('APPROVED');
    expect(lowRisk.executionAuthorized).toBe(false);
  });

  it('kill switch blocks automatic payment actions while preserving observation actions', () => {
    expect(evaluateRiskGate({ ...base, killSwitchActive: true }).state).toBe('POLICY_BLOCKED');
    expect(evaluateRiskGate({ ...base, action: 'DO_NOTHING', killSwitchActive: true }).state).toBe(
      'APPROVED',
    );
  });

  it('enforces explicit action state transitions', () => {
    expect(canTransition('RECOMMENDED', 'NEEDS_APPROVAL')).toBe(true);
    expect(canTransition('COMPLETED', 'EXECUTING')).toBe(false);
    expect(transitionAction('APPROVED', 'EXECUTING')).toBe('EXECUTING');
    expect(() => transitionAction('RECOMMENDED', 'COMPLETED')).toThrow(
      'Invalid recovery action transition',
    );
  });
});
