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
  requireIdempotency,
} from '@/server/api-helpers';
import { executeDemoRecovery } from '@/demo-data/service';
const schema = z.object({ opportunityId: z.string().min(1).max(100) });
export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.EXECUTE_RECOVERY);
  if (guard.response) return guard.response;
  const idempotencyError = requireIdempotency(request, guard.id);
  if (idempotencyError) return idempotencyError;
  const parsed = schema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid demo recovery request', guard.id, 400);
  try {
    return responseSuccess(
      await executeDemoRecovery(
        prisma,
        guard.session.merchantId,
        parsed.data.opportunityId,
        request.headers.get('idempotency-key') as string,
      ),
      guard.id,
      202,
    );
  } catch (error) {
    return error instanceof Error && error.message === 'AI_KILL_SWITCH_ACTIVE'
      ? responseFailure(
          'AI_KILL_SWITCH_ACTIVE',
          'Automatic actions and payment execution are disabled',
          guard.id,
          423,
        )
      : error instanceof Error && error.message === 'DEMO_MODE_REQUIRED'
        ? responseFailure('DEMO_MODE_REQUIRED', 'Demo mode is required', guard.id, 403)
        : error instanceof Error && error.message === 'OPPORTUNITY_NOT_FOUND'
          ? responseFailure(
              'OPPORTUNITY_NOT_FOUND',
              'Recovery opportunity was not found',
              guard.id,
              404,
            )
          : safeError(error, guard.id);
  }
}
