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
} from '@/server/api-helpers';
const experimentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(1000).optional(),
});
export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;
  try {
    return responseSuccess(
      await prisma.recoveryExperiment.findMany({
        where: { merchantId: guard.session.merchantId, isDeleted: false },
        include: { variants: true },
        orderBy: { createdAt: 'desc' },
      }),
      guard.id,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_OPERATIONS);
  if (guard.response) return guard.response;
  const parsed = experimentSchema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid experiment details', guard.id, 400);
  try {
    return responseSuccess(
      await prisma.recoveryExperiment.create({
        data: {
          ...parsed.data,
          merchantId: guard.session.merchantId,
          createdByUserId: guard.session.userId,
        },
      }),
      guard.id,
      201,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
