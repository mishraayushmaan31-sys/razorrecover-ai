import { RazorpayClient } from './client';
import type { RazorpayOrderRequest, RazorpayPaymentLinkRequest } from './types';

export class RazorpayIntegrationService {
  constructor(private readonly client: RazorpayClient) {}

  createTestOrder(input: RazorpayOrderRequest, idempotencyKey: string) {
    return this.client.createOrder(input, idempotencyKey);
  }

  getTestPayment(paymentId: string) {
    return this.client.fetchPayment(paymentId);
  }

  createTestPaymentLink(input: RazorpayPaymentLinkRequest, idempotencyKey: string) {
    return this.client.createPaymentLink(input, idempotencyKey);
  }
}
