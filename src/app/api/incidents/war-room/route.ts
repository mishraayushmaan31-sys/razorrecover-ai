import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { getWarRoomDetails } from '@/server/services/war-room-service';
import { protect, responseSuccess, safeError } from '@/server/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;

  try {
    const details = await getWarRoomDetails(prisma, guard.session.merchantId);
    return responseSuccess(details, guard.id);
  } catch (error) {
    return safeError(error, guard.id);
  }
}
