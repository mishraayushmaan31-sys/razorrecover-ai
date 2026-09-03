import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { serverEnv } from '@/env';

export const SESSION_COOKIE = 'rr_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type SessionClaims = {
  userId: string;
  merchantId: string;
  role: string;
};

const secret = new TextEncoder().encode(serverEnv.SESSION_SECRET);

export async function createSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ merchantId: claims.merchantId, role: claims.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

export async function readSessionToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    if (
      !payload.sub ||
      typeof payload.merchantId !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      return null;
    }

    return { userId: payload.sub, merchantId: payload.merchantId, role: payload.role };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', { httpOnly: true, expires: new Date(0), path: '/' });
}
