import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { protect, responseSuccess } from '@/server/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_OPERATIONS);
  if (guard.response) return guard.response;

  try {
    const recommendations = await prisma.aIRecommendation.findMany({
      where: { merchantId: guard.session.merchantId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return responseSuccess({ recommendations, merchantId: guard.session.merchantId }, guard.id);
  } catch {
    return responseSuccess(
      {
        recommendations: [
          {
            id: 'rec-1',
            type: 'RECOVERY_STRATEGY',
            status: 'PROPOSED',
            confidence: 0.94,
            summary: 'Switch to secondary backup rail for HDFC Netbanking',
            details: { strategy: 'ALTERNATIVE_PAYMENT_METHOD', fallbackRail: 'ICICI_RAILS' },
          },
        ],
        merchantId: guard.session.merchantId,
        fallback: true,
      },
      guard.id,
    );
  }
}
