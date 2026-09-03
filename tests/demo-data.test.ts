import { describe, expect, it } from 'vitest';
import { AppMode } from '@prisma/client';
import { buildDemoAttempts, buildDemoCustomers, DEMO_COUNTS } from '../demo-data/generator';
import { isDemoMode } from '../demo-data/service';

describe('deterministic demo mode', () => {
  it('generates the required fixed customer and attempt scenario', () => {
    const customers = buildDemoCustomers();
    const attempts = buildDemoAttempts();
    const counts = attempts.reduce<Record<string, number>>((result, attempt) => {
      const classification = (attempt.metadata as { classification: string }).classification;
      result[classification] = (result[classification] ?? 0) + 1;
      return result;
    }, {});

    expect(customers).toHaveLength(DEMO_COUNTS.highValueCustomers);
    expect(attempts).toHaveLength(DEMO_COUNTS.paymentAttempts);
    expect(counts.failed).toBe(DEMO_COUNTS.failed);
    expect(counts.retryable).toBe(DEMO_COUNTS.retryable);
    expect(counts.abandoned).toBe(DEMO_COUNTS.abandoned);
    expect(attempts[0]).toEqual(buildDemoAttempts()[0]);
  });

  it('allows reset operations only for demo tenants', () => {
    expect(isDemoMode(AppMode.DEMO)).toBe(true);
    expect(isDemoMode(AppMode.TEST)).toBe(false);
    expect(isDemoMode(AppMode.PRODUCTION)).toBe(false);
  });

  it('labels generated records as DEMO MODE', () => {
    expect(buildDemoCustomers()[0].metadata).toMatchObject({ label: 'DEMO MODE' });
    expect(buildDemoAttempts()[0].metadata).toMatchObject({ label: 'DEMO MODE', simulated: true });
  });
});
