import type { ApiFailure, ApiSuccess } from '@/types/api';

export function success<T>(data: T, requestId: string): ApiSuccess<T> {
  return { ok: true, data, requestId };
}

export function failure(code: string, message: string, requestId: string): ApiFailure {
  return {
    ok: false,
    error: { code, message },
    requestId,
  };
}
