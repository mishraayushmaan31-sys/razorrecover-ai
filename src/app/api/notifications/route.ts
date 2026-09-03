import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { protect, responseSuccess, safeError } from '@/server/api-helpers';
export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;
  try {
    return responseSuccess(
      await prisma.notification.findMany({
        where: { merchantId: guard.session.merchantId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      guard.id,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
