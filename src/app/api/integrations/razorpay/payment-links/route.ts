import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PERMISSIONS } from '@/auth/permissions';
import {
  jsonBody,
  protect,
  requireIdempotency,
  responseFailure,
  responseSuccess,
  safeError,
} from '@/server/api-helpers';
import { RazorpayClient, RazorpayIntegrationError } from '@/razorpay';

const schema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3).default('INR'),
  description: z.string().trim().min(1).max(500),
  customer: z
    .object({
      name: z.string().max(120).optional(),
      email: z.string().email().optional(),
      contact: z.string().max(32).optional(),
    })
    .optional(),
  reference_id: z.string().max(40).optional(),
});
export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_FINANCIALS);
  if (guard.response) return guard.response;
  const idempotencyError = requireIdempotency(request, guard.id);
  if (idempotencyError) return idempotencyError;
  const parsed = schema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid Razorpay test payment link', guard.id, 400);
  try {
    const link = await new RazorpayClient().createPaymentLink(
      parsed.data,
      request.headers.get('idempotency-key') as string,
    );
    return responseSuccess({ mode: 'RAZORPAY TEST MODE', paymentLink: link }, guard.id, 201);
  } catch (error) {
    if (error instanceof RazorpayIntegrationError && error.code === 'RAZORPAY_NOT_CONFIGURED') {
      return responseFailure(error.code, 'Razorpay Test Mode is not configured', guard.id, 503);
    }
    return safeError(error, guard.id);
  }
}
