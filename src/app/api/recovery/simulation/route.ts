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
import { RECOVERY_STRATEGIES, simulateRecovery } from '@/recovery-engine';

const schema = z.object({
  opportunityId: z.string().uuid(),
  strategies: z
    .array(z.enum(RECOVERY_STRATEGIES))
    .min(1)
    .max(7)
    .default([...RECOVERY_STRATEGIES]),
});

export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_OPERATIONS);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid what-if simulation request', guard.id, 400);
  try {
    const opportunity = await prisma.recoveryOpportunity.findFirst({
      where: {
        id: parsed.data.opportunityId,
        merchantId: guard.session.merchantId,
        isDeleted: false,
      },
      include: { customer: true },
    });
    if (!opportunity)
      return responseFailure(
        'OPPORTUNITY_NOT_FOUND',
        'Recovery opportunity was not found',
        guard.id,
        404,
      );
    const customerMetadata =
      opportunity.customer.metadata &&
      typeof opportunity.customer.metadata === 'object' &&
      !Array.isArray(opportunity.customer.metadata)
        ? (opportunity.customer.metadata as Record<string, unknown>)
        : {};
    const result = simulateRecovery(
      {
        id: opportunity.id,
        amount: (opportunity.estimatedAmount ?? opportunity.recommendedAmount ?? '0').toString(),
        riskScore: Number(opportunity.riskScore ?? 0),
        recoveryProbability: opportunity.aiScore ? Number(opportunity.aiScore) : undefined,
        customersAffected: 1,
        failureClassification: 'failed',
        customerSegment: customerMetadata.segment === 'high_value' ? 'high_value' : 'standard',
      },
      parsed.data.strategies,
    );
    return responseSuccess(result, guard.id, 200);
  } catch (error) {
    return safeError(error, guard.id);
  }
}
