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

const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  externalId: z.string().trim().max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(32).optional(),
});

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;
  try {
    const customers = await prisma.customer.findMany({
      where: { merchantId: guard.session.merchantId, isDeleted: false },
      select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true },
    });
    return responseSuccess(customers, guard.id);
  } catch (error) {
    return safeError(error, guard.id);
  }
}

export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_OPERATIONS);
  if (guard.response) return guard.response;
  const idempotencyError = requireIdempotency(request, guard.id);
  if (idempotencyError) return idempotencyError;
  const parsed = customerSchema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid customer details', guard.id, 400);
  try {
    const customer = await prisma.customer.create({
      data: { merchantId: guard.session.merchantId, ...parsed.data },
      select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true },
    });
    return responseSuccess(customer, guard.id, 201);
  } catch (error) {
    return safeError(error, guard.id);
  }
}
