import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { RazorpayClient } from '../razorpay/client';
import { verifyRazorpayWebhook } from '../razorpay/webhook';

describe('Razorpay Test Mode integration boundary', () => {
  it('sends typed requests with server-side basic auth and idempotency', async () => {
    let captured: RequestInit | undefined;
    const client = new RazorpayClient({
      transport: async (_url, init) => {
        captured = init;
        return new Response(
          JSON.stringify({
            id: 'order_test_1',
            entity: 'order',
            amount: 1000,
            currency: 'INR',
            status: 'created',
            receipt: 'receipt-1',
          }),
          { status: 200 },
        );
      },
    });
    const order = await client.createOrder(
      { amount: 1000, currency: 'INR', receipt: 'receipt-1' },
      'test-idempotency-1',
    );
    expect(order.id).toBe('order_test_1');
    expect(captured?.headers).toMatchObject({ 'X-Razorpay-Idempotency-Key': 'test-idempotency-1' });
    expect((captured?.headers as Record<string, string>).Authorization).toMatch(/^Basic /);
  });

  it('retries safe payment reads but not mutation requests', async () => {
    let calls = 0;
    const client = new RazorpayClient({
      maxRetries: 2,
      transport: async () => {
        calls += 1;
        return new Response('{}', { status: 503 });
      },
    });
    await expect(client.fetchPayment('pay_test_1')).rejects.toThrow('Razorpay request failed');
    expect(calls).toBe(3);
    calls = 0;
    const mutationClient = new RazorpayClient({
      maxRetries: 2,
      transport: async () => {
        calls += 1;
        return new Response('{}', { status: 503 });
      },
    });
    await expect(
      mutationClient.createOrder({ amount: 100, currency: 'INR', receipt: 'r' }, 'key'),
    ).rejects.toThrow('Razorpay request failed');
    expect(calls).toBe(1);
  });

  it('verifies the raw webhook payload signature', () => {
    const body = '{"event":"payment.captured"}';
    const signature = crypto
      .createHmac('sha256', 'local_webhook_secret')
      .update(body)
      .digest('hex');
    expect(verifyRazorpayWebhook(body, signature)).toBe(true);
    expect(verifyRazorpayWebhook(body, `${signature}bad`)).toBe(false);
  });
});
