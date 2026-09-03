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

const transactionSchema = z.object({
  customerId: z.string().uuid(),
  type: z.enum(['PAYMENT', 'REFUND', 'REVERSAL', 'ADJUSTMENT', 'CHARGEBACK']),
  status: z.enum([
    'PENDING',
    'PROCESSING',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED',
    'REVERSED',
    'DISPUTED',
  ]),
  amount: z.string().regex(/^\\d+(\\.\\d{1,2})?$/),
  currency: z.string().length(3).default('INR'),
});

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_FINANCIALS);
  if (guard.response) return guard.response;
  try {
    const transactions = await prisma.transaction.findMany({
      where: { merchantId: guard.session.merchantId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        customerId: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        createdAt: true,
      },
    });
    return responseSuccess(
      transactions.map((item) => ({ ...item, amount: item.amount.toFixed(2) })),
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
  const parsed = transactionSchema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid transaction details', guard.id, 400);
  try {
    const transaction = await prisma.transaction.create({
      data: {
        ...parsed.data,
        amount: parsed.data.amount,
        merchantId: guard.session.merchantId,
        idempotencyKey: request.headers.get('idempotency-key'),
      },
    });
    return responseSuccess(
      { ...transaction, amount: transaction.amount.toFixed(2) },
      guard.id,
      201,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
