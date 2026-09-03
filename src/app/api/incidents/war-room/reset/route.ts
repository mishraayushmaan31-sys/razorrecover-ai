import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { resetWarRoomIncident } from '@/server/services/war-room-service';
import { protect, responseSuccess, safeError } from '@/server/api-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_OPERATIONS);
  if (guard.response) return guard.response;

  try {
    const reset = await resetWarRoomIncident(prisma, guard.session.merchantId);
    return responseSuccess(reset, guard.id);
  } catch (error) {
    return safeError(error, guard.id);
  }
}
