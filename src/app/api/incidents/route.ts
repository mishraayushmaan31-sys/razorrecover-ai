import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import {
  jsonBody,
  protect,
  responseFailure,
  responseSuccess,
  safeError,
} from '@/server/api-helpers';

const incidentSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(2000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  customerId: z.string().uuid().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;
  try {
    const dbIncidents = await prisma.incident.findMany({
      where: { merchantId: guard.session.merchantId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const canonicalIncident1042 = {
      id: 'inc-demo-01042',
      incidentNumber: 1042,
      merchantId: guard.session.merchantId,
      title: 'REVENUE INCIDENT #1042 – HDFC Netbanking Degradation & High-Value Subscriptions',
      description:
        'Payment degradation detected: 96.4% → 78.1% success rate drop, ₹6,42,800 revenue at risk, AI confidence 94%.',
      status: 'INVESTIGATING',
      severity: 'CRITICAL',
      source: 'AI_REVENUE_INCIDENT_DETECTOR',
      metadata: {
        label: 'DEMO MODE',
        incidentNumber: 1042,
        paymentSuccessNormal: '96.4%',
        paymentSuccessCurrent: '78.1%',
        failureRateNormal: '3.6%',
        failureRateCurrent: '21.9%',
        revenueAtRisk: '₹6,42,800',
        aiConfidence: 94,
        affectedSegment: 'HDFC & ICICI Netbanking / High-Value Subscriptions',
        warRoomAvailable: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prepend canonical incident #1042 if not already stored with that id
    const incidents = dbIncidents.some((i) => i.id === canonicalIncident1042.id)
      ? dbIncidents
      : [canonicalIncident1042, ...dbIncidents];

    return responseSuccess(incidents, guard.id);
  } catch (error) {
    return safeError(error, guard.id);
  }
}

export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_OPERATIONS);
  if (guard.response) return guard.response;
  const parsed = incidentSchema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid incident details', guard.id, 400);
  try {
    return responseSuccess(
      await prisma.incident.create({
        data: { ...parsed.data, merchantId: guard.session.merchantId },
      }),
      guard.id,
      201,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
