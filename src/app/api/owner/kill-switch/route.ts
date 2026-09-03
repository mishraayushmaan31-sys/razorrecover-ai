import { NextRequest, NextResponse } from 'next/server';
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
import { isAiKillSwitchActive, setAiKillSwitch } from '@/policies';

const schema = z.object({ active: z.boolean() });

export async function POST(request: NextRequest): Promise<NextResponse> {
  const guard = await protect(request, PERMISSIONS.KILL_SWITCH);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Body must contain boolean active', guard.id, 400);
  try {
    return responseSuccess(
      await setAiKillSwitch(
        prisma,
        guard.session.merchantId,
        guard.session.userId,
        parsed.data.active,
      ),
      guard.id,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;
  try {
    return responseSuccess(
      {
        active: await isAiKillSwitchActive(prisma, guard.session.merchantId),
        analyticsEnabled: true,
        recommendationsEnabled: true,
      },
      guard.id,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
