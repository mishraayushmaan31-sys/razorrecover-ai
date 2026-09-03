import { NextResponse } from 'next/server';
import { recordLogout } from '@/auth/auth-service';
import { clearSessionCookie, readSessionToken, SESSION_COOKIE } from '@/auth/session';
import { failure, success } from '@/lib/api-response';
import { requestId } from '@/lib/request-id';

export async function POST(request: Request): Promise<NextResponse> {
  const id = requestId();
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.split('=')[1];
  const session = await readSessionToken(token);

  if (session) {
    await recordLogout(session.merchantId, session.userId);
  }

  await clearSessionCookie();
  return NextResponse.json(success({ loggedOut: true }, id), { status: 200 });
}

export function GET(): NextResponse {
  return NextResponse.json(failure('METHOD_NOT_ALLOWED', 'Use POST to log out', requestId()), {
    status: 405,
  });
}
