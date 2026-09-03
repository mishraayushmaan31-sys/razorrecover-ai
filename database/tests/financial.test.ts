import { describe, expect, it } from 'vitest';
import {
  toMoney,
  moneyToCents,
  normalizeTenantScope,
  isNonNegativeMoney,
} from '../utils/financial.js';

describe('database finance utilities', () => {
  it('normalizes decimal values safely for financial operations', () => {
    expect(toMoney('125.50')).toBe('125.50');
    expect(toMoney(125.5)).toBe('125.50');
    expect(isNonNegativeMoney('0.00')).toBe(true);
    expect(isNonNegativeMoney('-10.00')).toBe(false);
  });

  it('converts decimal values to cents without floating-point drift', () => {
    expect(moneyToCents('12.34')).toBe(1234);
    expect(moneyToCents('0.10')).toBe(10);
  });

  it('keeps tenant scoping consistent', () => {
    expect(normalizeTenantScope('merchant-123')).toBe('merchant-123');
    expect(normalizeTenantScope(' Merchant-123 ')).toBe('merchant-123');
  });
});
