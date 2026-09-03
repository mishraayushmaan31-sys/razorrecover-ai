import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/auth/auth-service';
import { getRequestSession } from '@/authorization/middleware';
import { failure, success } from '@/lib/api-response';
import { requestId } from '@/lib/request-id';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const id = requestId();
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json(failure('UNAUTHENTICATED', 'Authentication is required', id), {
      status: 401,
    });
  }

  const user = await getCurrentUser(session.userId, session.merchantId);
  if (!user) {
    return NextResponse.json(failure('UNAUTHENTICATED', 'Session is no longer active', id), {
      status: 401,
    });
  }

  return NextResponse.json(success(user, id), { status: 200 });
}
