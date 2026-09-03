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
const schema = z.object({ eventType: z.string().min(1).max(60) });
export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_OPERATIONS);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid demo event', guard.id, 400);
  try {
    return responseSuccess(
      await generateDemoEvent(prisma, guard.session.merchantId, parsed.data.eventType),
      guard.id,
      201,
    );
  } catch (error) {
    return error instanceof Error && error.message === 'INVALID_EVENT_TYPE'
      ? responseFailure('INVALID_EVENT_TYPE', 'Unsupported demo event', guard.id, 400)
      : safeError(error, guard.id);
  }
}
