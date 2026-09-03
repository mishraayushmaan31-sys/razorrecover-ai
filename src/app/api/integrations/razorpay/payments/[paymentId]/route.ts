import { NextRequest } from 'next/server';
import { PERMISSIONS } from '@/auth/permissions';
import { protect, responseFailure, responseSuccess, safeError } from '@/server/api-helpers';
import { RazorpayClient, RazorpayIntegrationError } from '@/razorpay';

type Context = { params: Promise<{ paymentId: string }> };
export async function GET(request: NextRequest, context: Context) {
  const guard = await protect(request, PERMISSIONS.VIEW_FINANCIALS);
  if (guard.response) return guard.response;
  const { paymentId } = await context.params;
  if (!/^[A-Za-z0-9_\-]{1,80}$/.test(paymentId))
    return responseFailure('VALIDATION_ERROR', 'Invalid payment identifier', guard.id, 400);
  try {
    const payment = await new RazorpayClient().fetchPayment(paymentId);
    return responseSuccess({ mode: 'RAZORPAY TEST MODE', payment }, guard.id);
  } catch (error) {
    if (error instanceof RazorpayIntegrationError && error.code === 'RAZORPAY_NOT_CONFIGURED') {
      return responseFailure(error.code, 'Razorpay Test Mode is not configured', guard.id, 503);
    }
    return safeError(error, guard.id);
  }
}
