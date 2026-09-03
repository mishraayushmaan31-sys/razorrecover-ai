import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import {
  jsonBody,
  protect,
  responseFailure,
  responseSuccess,
  safeError,
  requireIdempotency,
} from '@/server/api-helpers';

const paymentSchema = z.object({
  amount: z.string().regex(/^\\d+(\\.\\d{1,2})?$/),
  currency: z.string().length(3).default('INR'),
  customerId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_FINANCIALS);
  if (guard.response) return guard.response;
  try {
    const payments = await prisma.payment.findMany({
      where: { merchantId: guard.session.merchantId, isDeleted: false },
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        customerId: true,
        createdAt: true,
      },
    });
    return responseSuccess(
      payments.map((item) => ({ ...item, amount: item.amount.toFixed(2) })),
      guard.id,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}

export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_FINANCIALS);
  if (guard.response) return guard.response;
  const idempotencyError = requireIdempotency(request, guard.id);
  if (idempotencyError) return idempotencyError;
  const parsed = paymentSchema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid payment details', guard.id, 400);
  try {
    const payment = await prisma.payment.create({
      data: {
        merchantId: guard.session.merchantId,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        customerId: parsed.data.customerId,
        orderId: parsed.data.orderId,
        idempotencyKey: request.headers.get('idempotency-key'),
      },
    });
    return responseSuccess({ ...payment, amount: payment.amount.toFixed(2) }, guard.id, 201);
  } catch (error) {
    return safeError(error, guard.id);
  }
}
