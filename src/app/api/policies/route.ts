import { NextRequest } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import {
  jsonBody,
  protect,
  responseFailure,
  responseSuccess,
  safeError,
} from '@/server/api-helpers';
const policySchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(['RISK_THRESHOLD', 'RECOVERY_ACTION', 'APPROVAL_REQUIREMENT', 'APPROVAL_EXEMPTION']),
  rules: z.record(z.unknown()),
  summary: z.string().max(500).optional(),
});
export async function GET(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;
  try {
    return responseSuccess(
      await prisma.policy.findMany({
        where: { merchantId: guard.session.merchantId, isDeleted: false, isActive: true },
        orderBy: { updatedAt: 'desc' },
      }),
      guard.id,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_SETTINGS);
  if (guard.response) return guard.response;
  const parsed = policySchema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid policy details', guard.id, 400);
  try {
    return responseSuccess(
      await prisma.policy.create({
        data: {
          ...parsed.data,
          merchantId: guard.session.merchantId,
          rules: parsed.data.rules as Prisma.InputJsonValue,
        },
      }),
      guard.id,
      201,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
