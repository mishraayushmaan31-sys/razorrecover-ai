import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { protect, responseFailure, responseSuccess, safeError } from '@/server/api-helpers';
import { resetDemo } from '@/demo-data/service';

export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.KILL_SWITCH);
  if (guard.response) return guard.response;
  try {
    return responseSuccess(await resetDemo(prisma, guard.session.merchantId), guard.id);
  } catch (error) {
    return error instanceof Error && error.message === 'DEMO_MODE_REQUIRED'
      ? responseFailure('DEMO_MODE_REQUIRED', 'Only demo merchants can be reset', guard.id, 403)
      : safeError(error, guard.id);
  }
}
