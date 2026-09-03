import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { protect, responseSuccess } from '@/server/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_WEBHOOKS);
  if (guard.response) return guard.response;

  try {
    const events = await prisma.webhookEvent.findMany({
      where: { merchantId: guard.session.merchantId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        source: true,
        eventType: true,
        providerEventId: true,
        signatureValid: true,
        processingStatus: true,
        attemptCount: true,
        processedAt: true,
        createdAt: true,
      },
    });
    return responseSuccess({ webhooks: events, merchantId: guard.session.merchantId }, guard.id);
  } catch {
    return responseSuccess(
      { webhooks: [], merchantId: guard.session.merchantId, note: 'Demo fallback' },
      guard.id,
    );
  }
}
