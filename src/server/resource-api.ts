import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { PERMISSIONS } from '@/auth/permissions';
import {
  jsonBody,
  protect,
  responseFailure,
  responseSuccess,
  safeError,
  requireIdempotency,
} from '@/server/api-helpers';

const safeActionSchema = z.object({
  opportunityId: z.string().uuid(),
  actionType: z.enum(['RETRY_PAYMENT', 'SEND_NOTIFICATION', 'REQUEST_HUMAN_REVIEW']),
});

export async function scaffoldGet(
  request: NextRequest,
  permission = PERMISSIONS.VIEW_DASHBOARD,
  resource: string,
) {
  const guard = await protect(request, permission);
  if (guard.response) return guard.response;
  return responseSuccess(
    { resource, status: 'available', items: [], merchantId: guard.session.merchantId },
    guard.id,
  );
}

export async function safeSimulation(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_OPERATIONS);
  if (guard.response) return guard.response;
  const idempotencyError = requireIdempotency(request, guard.id);
  if (idempotencyError) return idempotencyError;
  const parsed = safeActionSchema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure(
      'VALIDATION_ERROR',
      'Only a supported action type can be simulated',
      guard.id,
      400,
    );
  return responseSuccess(
    { ...parsed.data, status: 'SIMULATION_ONLY', executed: false },
    guard.id,
    202,
  );
}

export async function blockedExecution(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.EXECUTE_RECOVERY);
  if (guard.response) return guard.response;
  const idempotencyError = requireIdempotency(request, guard.id);
  if (idempotencyError) return idempotencyError;
  return responseFailure(
    'EXECUTION_NOT_ENABLED',
    'Deterministic execution service is not enabled in this foundation',
    guard.id,
    501,
  );
}

export async function safePost(
  request: NextRequest,
  permission: typeof PERMISSIONS.MANAGE_OPERATIONS,
  resource: string,
) {
  const guard = await protect(request, permission);
  if (guard.response) return guard.response;
  const parsed = z.record(z.unknown()).safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Request body must be a JSON object', guard.id, 400);
  try {
    return responseSuccess(
      { resource, status: 'accepted_for_service_layer', data: parsed.data },
      guard.id,
      202,
    );
  } catch (error) {
    return safeError(error, guard.id);
  }
}
