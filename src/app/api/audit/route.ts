import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { protect, responseSuccess } from '@/server/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_AUDIT_LOG);
  if (guard.response) return guard.response;

  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: { merchantId: guard.session.merchantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return responseSuccess({ auditLogs, merchantId: guard.session.merchantId }, guard.id);
  } catch {
    return responseSuccess(
      { auditLogs: [], merchantId: guard.session.merchantId, note: 'Demo fallback' },
      guard.id,
    );
  }
}
