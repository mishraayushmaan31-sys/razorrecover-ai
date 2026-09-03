import { NextRequest, NextResponse } from 'next/server';
import { getRequestSession } from '@/authorization/middleware';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication is required' } },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
