import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { protect, responseSuccess, safeError } from '@/server/api-helpers';

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_AUDIT_LOG);
  if (guard.response) return guard.response;
  try {
    const entries = await prisma.explainabilityLedger.findMany({
      where: { merchantId: guard.session.merchantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return responseSuccess(
      entries.map((entry) => ({
        ...entry,
        confidence: entry.confidence.toFixed(2),
        revenueRescued: entry.revenueRescued.toFixed(2),
      })),
      guard.id,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
