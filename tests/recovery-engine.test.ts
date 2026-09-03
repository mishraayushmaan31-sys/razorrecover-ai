import { describe, expect, it } from 'vitest';
import { RECOVERY_STRATEGIES, projectRecovery, simulateRecovery } from '../recovery-engine';

describe('smart recovery engine', () => {
  const opportunity = {
    id: 'opportunity-1',
    amount: '10000.00',
    riskScore: 35,
    recoveryProbability: 70,
    customersAffected: 1,
    failureClassification: 'retryable' as const,
    customerSegment: 'high_value' as const,
  };

  it('projects every supported strategy with financial and operational metrics', () => {
    const result = simulateRecovery(opportunity);
    expect(result.label).toBe('SIMULATION ONLY');
    expect(result.sideEffectFree).toBe(true);
    expect(result.projections).toHaveLength(7);
    expect(result.projections.map((item) => item.strategy)).toEqual([...RECOVERY_STRATEGIES]);
    for (const projection of result.projections) {
      expect(Number(projection.expectedRecovery)).toBeGreaterThanOrEqual(0);
      expect(projection.recoveryProbability).toBeGreaterThanOrEqual(0);
      expect(projection.recoveryProbability).toBeLessThanOrEqual(95);
      expect(projection.cost).toMatch(/^\d+\.\d{2}$/);
      expect(projection.roi).toMatch(/^-?\d+\.\d{2}$/);
      expect(projection.rationale.length).toBeGreaterThan(0);
    }
  });

  it('compares selected strategies without mutating the opportunity input', () => {
    const before = JSON.stringify(opportunity);
    const result = simulateRecovery(opportunity, ['RETRY', 'PAYMENT_LINK']);
    expect(JSON.stringify(opportunity)).toBe(before);
    expect(result.projections.map((item) => item.strategy)).toEqual(['RETRY', 'PAYMENT_LINK']);
  });

  it('does not modify financial records during simulation', () => {
    const financialRecords = Object.freeze({
      paymentStatus: 'FAILED',
      ledgerAmount: '10000.00',
      ledgerEntries: 0,
    });
    const before = JSON.stringify(financialRecords);
    simulateRecovery(opportunity);
    expect(JSON.stringify(financialRecords)).toBe(before);
  });

  it('raises risk for high-risk opportunities without executing anything', () => {
    const projection = projectRecovery('RETRY', { ...opportunity, riskScore: 90 });
    expect(projection.risk).toBe('HIGH');
    expect(projection.timeToRecovery).toBe('minutes');
  });

  it('rejects unsupported strategies', () => {
    expect(() => simulateRecovery(opportunity, ['ARBITRARY_COMMAND' as never])).toThrow(
      'Unsupported recovery strategy',
    );
  });
});
