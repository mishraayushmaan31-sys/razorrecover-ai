import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { getLiveIncidentDetection } from '@/server/services/incident-detection-service';
import { protect, responseSuccess, safeError } from '@/server/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;

  try {
    const detection = await getLiveIncidentDetection(prisma, guard.session.merchantId);
    return responseSuccess(detection, guard.id);
  } catch (error) {
    return safeError(error, guard.id);
  }
}
