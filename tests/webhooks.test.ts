/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import {
  processWebhookEvent,
  shouldApplyPaymentStatus,
  type WebhookInput,
} from '../webhooks/processor';

const merchantId = 'merchant-1';

function event(overrides: Partial<WebhookInput> = {}): WebhookInput {
  return {
    merchantId,
    source: 'razorpay',
    eventId: 'event-1',
    eventType: 'payment.authorized',
    signatureValid: true,
    payload: { payment: { entity: { id: 'pay-1', amount: 1000 } } },
    ...overrides,
  };
}

function fakeClient(options: { duplicate?: boolean; paymentMissing?: boolean } = {}) {
  const records: Record<string, any> = {};
  const payment = options.paymentMissing
    ? null
    : { id: 'payment-1', status: 'PENDING', currency: 'INR' };
  return {
    records,
    webhookEvent: {
      create: async ({ data }: any) => {
        if (options.duplicate || records[data.dedupeKey]) {
          const error = Object.assign(new Error('duplicate'), { code: 'P2002' });
          throw error;
        }
        const record = {
          id: `webhook-${Object.keys(records).length + 1}`,
          ...data,
          attemptCount: 0,
        };
        records[data.dedupeKey] = record;
        return record;
      },
      findUnique: async ({ where }: any) => records[where.merchantId_dedupeKey.dedupeKey] ?? null,
      update: async ({ where, data }: any) => {
        const record = Object.values(records).find((item: any) => item.id === where.id) as any;
        const nextAttemptCount =
          typeof data.attemptCount === 'number'
            ? data.attemptCount
            : record.attemptCount + (data.attemptCount?.increment ?? 0);
        Object.assign(record, { ...data, attemptCount: nextAttemptCount });
        return record;
      },
    },
    payment: {
      findFirst: async () => payment,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        if (!payment) throw new Error('payment missing');
        return Object.assign(payment, data);
      },
    },
    revenueLedger: {
      create: async ({ data }: any) => ({ id: 'ledger-1', ...data }),
      createMany: async () => ({ count: 1 }),
    },
    auditLog: {
      create: async ({ data }: any) => data,
    },
    recoveryOpportunity: { updateMany: async () => ({ count: 1 }) },
    recoveryAction: { updateMany: async () => ({ count: 1 }) },
    humanReview: { create: async ({ data }: any) => data },
    $transaction: async (callback: (tx: any) => Promise<unknown>) =>
      callback({
        payment: {
          findFirst: async () => payment,
          update: async ({ data }: { data: Record<string, unknown> }) => {
            if (!payment) throw new Error('payment missing');
            return Object.assign(payment, data);
          },
        },
        revenueLedger: { createMany: async () => ({ count: 1 }) },
        webhookEvent: {
          update: async ({ where, data }: any) => {
            const record = Object.values(records).find((item: any) => item.id === where.id) as any;
            const nextAttemptCount =
              typeof data.attemptCount === 'number'
                ? data.attemptCount
                : record.attemptCount + (data.attemptCount?.increment ?? 0);
            Object.assign(record, { ...data, attemptCount: nextAttemptCount });
            return record;
          },
        },
        auditLog: { create: async ({ data }: any) => data },
        recoveryOpportunity: { updateMany: async () => ({ count: 1 }) },
        recoveryAction: { updateMany: async () => ({ count: 1 }) },
        humanReview: { create: async ({ data }: any) => data },
      }),
  } as any;
}

describe('secure webhook processing', () => {
  it('persists and processes a valid payment webhook', async () => {
    const client = fakeClient();
    await expect(processWebhookEvent(client, event())).resolves.toMatchObject({
      status: 'processed',
    });
    expect(client.records['event-1'].processingStatus).toBe('processed');
  });

  it('ignores a duplicate event without processing it twice', async () => {
    const client = fakeClient();
    await processWebhookEvent(client, event());
    await expect(processWebhookEvent(client, event())).resolves.toMatchObject({
      status: 'duplicate',
    });
  });

  it('rejects invalid signatures and unknown events before persistence', async () => {
    const client = fakeClient();
    await expect(processWebhookEvent(client, event({ signatureValid: false }))).rejects.toThrow(
      'INVALID_WEBHOOK_SIGNATURE',
    );
    await expect(
      processWebhookEvent(client, event({ eventType: 'payment.unknown' })),
    ).rejects.toThrow('UNKNOWN_EVENT');
    expect(Object.keys(client.records)).toHaveLength(0);
  });

  it('does not apply an older payment state after a newer state', () => {
    expect(shouldApplyPaymentStatus('CAPTURED', 'FAILED')).toBe(false);
    expect(shouldApplyPaymentStatus('FAILED', 'AUTHORIZED')).toBe(true);
  });

  it('marks processing failures retryable and later dead-lettered', async () => {
    const client = fakeClient({ paymentMissing: true });
    const first = await processWebhookEvent(client, event());
    expect(first).toMatchObject({ status: 'retryable', attemptCount: 1 });
    const second = await processWebhookEvent(client, event());
    expect(second).toMatchObject({ status: 'retryable', attemptCount: 2 });
    const third = await processWebhookEvent(client, event());
    expect(third).toMatchObject({ status: 'dead_letter', attemptCount: 3 });
  });
});
