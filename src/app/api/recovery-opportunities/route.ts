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

const opportunitySchema = z.object({
  customerId: z.string().uuid(),
  reason: z.string().trim().min(2).max(500),
  estimatedAmount: z
    .string()
    .regex(/^\\d+(\\.\\d{1,2})?$/)
    .optional(),
  paymentId: z.string().uuid().optional(),
  transactionId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;
  try {
    const items = await prisma.recoveryOpportunity.findMany({
      where: { merchantId: guard.session.merchantId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return responseSuccess(
      items.map((item) => ({
        ...item,
        estimatedAmount: item.estimatedAmount?.toFixed(2) ?? null,
        recommendedAmount: item.recommendedAmount?.toFixed(2) ?? null,
      })),
      guard.id,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}

export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_OPERATIONS);
  if (guard.response) return guard.response;
  const idempotencyError = requireIdempotency(request, guard.id);
  if (idempotencyError) return idempotencyError;
  const parsed = opportunitySchema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid recovery opportunity', guard.id, 400);
  try {
    const item = await prisma.recoveryOpportunity.create({
      data: {
        ...parsed.data,
        merchantId: guard.session.merchantId,
        idempotencyKey: request.headers.get('idempotency-key'),
      },
    });
    return responseSuccess(
      { ...item, estimatedAmount: item.estimatedAmount?.toFixed(2) ?? null },
      guard.id,
      201,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
