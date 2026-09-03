import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const simulationSchema = z.object({
  opportunityId: z.string().uuid(),
  actionType: z.enum(['RETRY_PAYMENT', 'SEND_NOTIFICATION', 'REQUEST_HUMAN_REVIEW']),
});

describe('REST API contracts', () => {
  it('accepts only known recovery simulation actions', () => {
    expect(
      simulationSchema.safeParse({
        opportunityId: '00000000-0000-0000-0000-000000000001',
        actionType: 'RETRY_PAYMENT',
      }).success,
    ).toBe(true);
    expect(
      simulationSchema.safeParse({
        opportunityId: '00000000-0000-0000-0000-000000000001',
        actionType: 'run arbitrary command',
      }).success,
    ).toBe(false);
  });

  it('requires UUID resource identifiers', () => {
    expect(
      simulationSchema.safeParse({ opportunityId: 'not-an-id', actionType: 'SEND_NOTIFICATION' })
        .success,
    ).toBe(false);
  });
});
