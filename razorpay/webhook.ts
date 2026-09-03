import crypto from 'node:crypto';
import { serverEnv } from '@/env';
import { RazorpayIntegrationError } from './errors';

export function verifyRazorpayWebhook(rawBody: string, signature: string): boolean {
  const secret = serverEnv.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = Buffer.from(signature, 'utf8');
  const calculated = Buffer.from(expected, 'utf8');
  return provided.length === calculated.length && crypto.timingSafeEqual(provided, calculated);
}

export function requireVerifiedWebhook(rawBody: string, signature: string): void {
  if (!verifyRazorpayWebhook(rawBody, signature)) {
    throw new RazorpayIntegrationError(
      'Invalid Razorpay webhook signature',
      'INVALID_WEBHOOK_SIGNATURE',
      401,
    );
  }
}
