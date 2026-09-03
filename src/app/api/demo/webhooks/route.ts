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
import { generateDemoEvent } from '@/demo-data/service';
const schema = z.object({
  eventType: z.enum(['payment.failed', 'payment.retryable', 'payment.recovered']),
});
export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_WEBHOOKS);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid webhook simulation', guard.id, 400);
  try {
    return responseSuccess(
      await generateDemoEvent(prisma, guard.session.merchantId, parsed.data.eventType),
      guard.id,
      201,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
