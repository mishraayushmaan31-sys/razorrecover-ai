import { serverEnv } from '@/env';
import { logger } from '@/lib/logger';
import { RazorpayIntegrationError } from './errors';
import type {
  RazorpayPayment,
  RazorpayOrder,
  RazorpayOrderRequest,
  RazorpayPaymentLink,
  RazorpayPaymentLinkRequest,
  RazorpayTransport,
} from './types';

const BASE_URL = 'https://api.razorpay.com/v1';

export class RazorpayClient {
  private readonly transport: RazorpayTransport;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(
    options: { transport?: RazorpayTransport; timeoutMs?: number; maxRetries?: number } = {},
  ) {
    if (serverEnv.RAZORPAY_MODE !== 'test') {
      throw new RazorpayIntegrationError(
        'Only Razorpay Test Mode is enabled',
        'RAZORPAY_TEST_MODE_REQUIRED',
      );
    }
    if (!serverEnv.RAZORPAY_KEY_ID || !serverEnv.RAZORPAY_KEY_SECRET) {
      throw new RazorpayIntegrationError(
        'Razorpay test credentials are not configured',
        'RAZORPAY_NOT_CONFIGURED',
      );
    }
    this.transport = options.transport ?? fetch;
    this.timeoutMs = options.timeoutMs ?? serverEnv.RAZORPAY_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? serverEnv.RAZORPAY_MAX_RETRIES;
  }

  async createOrder(input: RazorpayOrderRequest, idempotencyKey: string): Promise<RazorpayOrder> {
    return this.request<RazorpayOrder>('/orders', {
      method: 'POST',
      body: input,
      idempotencyKey,
      retry: false,
    });
  }

  async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    return this.request<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      retry: true,
    });
  }

  async createPaymentLink(
    input: RazorpayPaymentLinkRequest,
    idempotencyKey: string,
  ): Promise<RazorpayPaymentLink> {
    return this.request<RazorpayPaymentLink>('/payment_links', {
      method: 'POST',
      body: input,
      idempotencyKey,
      retry: false,
    });
  }

  private async request<T>(
    path: string,
    options: { method: 'GET' | 'POST'; body?: unknown; idempotencyKey?: string; retry: boolean },
  ): Promise<T> {
    let attempt = 0;
    while (true) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        logger.info('Razorpay test-mode request', {
          provider: 'razorpay',
          path,
          method: options.method,
          attempt,
        });
        const response = await this.transport(`${BASE_URL}${path}`, {
          method: options.method,
          headers: {
            Authorization: `Basic ${Buffer.from(`${serverEnv.RAZORPAY_KEY_ID}:${serverEnv.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/json',
            ...(options.idempotencyKey
              ? { 'X-Razorpay-Idempotency-Key': options.idempotencyKey }
              : {}),
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (response.ok) return payload as T;
        const retryableStatus =
          response.status === 408 || response.status === 429 || response.status >= 500;
        if (!options.retry || !retryableStatus || attempt >= this.maxRetries) {
          throw new RazorpayIntegrationError(
            'Razorpay request failed',
            'RAZORPAY_REQUEST_FAILED',
            response.status,
            retryableStatus,
          );
        }
      } catch (error) {
        if (error instanceof RazorpayIntegrationError) throw error;
        if (!options.retry || attempt >= this.maxRetries) {
          throw new RazorpayIntegrationError(
            'Razorpay request timed out or failed',
            'RAZORPAY_NETWORK_ERROR',
            undefined,
            true,
          );
        }
      } finally {
        clearTimeout(timeout);
      }
      attempt += 1;
    }
  }
}
