import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { protect, responseSuccess, safeError } from '@/server/api-helpers';
import { getReviewQueue } from '@/human-review';

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;
  try {
    return responseSuccess(await getReviewQueue(prisma, guard.session.merchantId), guard.id);
  } catch (error) {
    return safeError(error, guard.id);
  }
}
