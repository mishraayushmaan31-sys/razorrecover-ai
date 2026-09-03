import type { NextRequest } from 'next/server';
import { hasPermission, type Permission } from '@/auth/permissions';
import { readSessionToken, SESSION_COOKIE } from '@/auth/session';

export async function getRequestSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function authorizeRequest(request: NextRequest, permission: Permission) {
  const session = await getRequestSession(request);

  if (!session || !hasPermission(session.role, permission)) {
    return { authorized: false as const, session: null };
  }

  return { authorized: true as const, session };
}

export function sameTenant(sessionMerchantId: string, resourceMerchantId: string): boolean {
  return sessionMerchantId === resourceMerchantId;
}
