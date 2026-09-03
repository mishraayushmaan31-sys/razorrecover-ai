import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { jsonBody, protect, responseFailure, responseSuccess } from '@/server/api-helpers';
import {
  evaluateRiskGate,
  isAiKillSwitchActive,
  loadMerchantPolicy,
  type RecoveryActionKind,
} from '@/policies';

const schema = z.object({
  actionId: z.string().min(1).max(120),
  action: z.enum([
    'PAYMENT_RETRY',
    'PAYMENT_LINK',
    'ALTERNATIVE_PAYMENT',
    'REMINDER',
    'PERSONALIZED_MESSAGE',
    'HUMAN_ASSISTANCE',
    'DO_NOTHING',
  ]),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  riskScore: z.number().int().min(0).max(100),
  confidence: z.number().min(0).max(1),
  retryCount: z.number().int().nonnegative().default(0),
  customerContactCount: z.number().int().nonnegative().default(0),
  dailyRecoveredAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .default('0.00'),
  hasSuccessfulRecovery: z.boolean().default(false),
  automatic: z.boolean().default(true),
  approvalDecision: z.enum(['APPROVED', 'REJECTED', 'PENDING']).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_OPERATIONS);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure(
      'VALIDATION_ERROR',
      'Invalid recovery authorization request',
      guard.id,
      400,
    );
  const result = evaluateRiskGate({
    ...parsed.data,
    action: parsed.data.action as RecoveryActionKind,
    policy: await loadMerchantPolicy(prisma, guard.session.merchantId),
    killSwitchActive: await isAiKillSwitchActive(prisma, guard.session.merchantId),
  });
  return responseSuccess(
    {
      merchantId: guard.session.merchantId,
      chain: [
        'AI Recommendation',
        'Policy Evaluation',
        'Risk Evaluation',
        'Approval Decision',
        'Execution Authorization',
      ],
      ...result,
    },
    guard.id,
  );
}
