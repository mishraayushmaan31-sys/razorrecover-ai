import { NextRequest, NextResponse } from 'next/server';
import { getRequestSession } from '@/authorization/middleware';
import { hasPermission, type Permission } from '@/auth/permissions';
import { failure, success } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { requestId } from '@/lib/request-id';

const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

export function jsonBody(request: NextRequest): Promise<unknown> {
  return request.json().catch(() => null);
}

export function responseSuccess<T>(data: T, id: string, status = 200) {
  return NextResponse.json(success(data, id), { status });
}

export function responseFailure(code: string, message: string, id: string, status: number) {
  return NextResponse.json(failure(code, message, id), { status });
}

export async function protect(request: NextRequest, permission: Permission) {
  const id = requestId();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `${permission}:${ip}`;
  const now = Date.now();
  if (buckets.size > 200) {
    for (const [k, v] of buckets.entries()) {
      if (v.resetAt <= now) {
        buckets.delete(k);
      }
    }
  }
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    bucket.count += 1;
    if (bucket.count > MAX_REQUESTS) {
      logger.warn('API rate limit exceeded', { requestId: id, permission });
      return { id, response: responseFailure('RATE_LIMITED', 'Too many requests', id, 429) };
    }
  }

  const session = await getRequestSession(request);
  if (!session) {
    return {
      id,
      response: responseFailure('UNAUTHENTICATED', 'Authentication is required', id, 401),
    };
  }
  if (!hasPermission(session.role, permission)) {
    return { id, response: responseFailure('FORBIDDEN', 'Permission is required', id, 403) };
  }

  return { id, session, response: null };
}

export function requireIdempotency(request: NextRequest, id: string) {
  const key = request.headers.get('idempotency-key')?.trim();
  if (!key || key.length > 128) {
    return responseFailure(
      'IDEMPOTENCY_KEY_REQUIRED',
      'A valid Idempotency-Key header is required',
      id,
      400,
    );
  }
  return null;
}

export function safeError(error: unknown, id: string) {
  logger.error('API request failed', {
    requestId: id,
    error: error instanceof Error ? error.message : 'unknown error',
  });
  return responseFailure('INTERNAL_ERROR', 'The request could not be completed', id, 500);
}
