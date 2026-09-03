import { NextResponse } from 'next/server';
import { login } from '@/auth/auth-service';
import { loginSchema } from '@/auth/schemas';
import { createSessionToken, setSessionCookie } from '@/auth/session';
import { failure, success } from '@/lib/api-response';
import { requestId } from '@/lib/request-id';

export async function POST(request: Request): Promise<NextResponse> {
  const id = requestId();
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(failure('VALIDATION_ERROR', 'Invalid login details', id), {
      status: 400,
    });
  }

  try {
    const result = await login(parsed.data);
    const token = await createSessionToken(result);
    await setSessionCookie(token);
    return NextResponse.json(
      success({ userId: result.userId, merchantId: result.merchantId, role: result.role }, id),
      { status: 200 },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INVALID_CREDENTIALS';
    const status = code === 'ACCOUNT_LOCKED' ? 423 : 401;
    return NextResponse.json(
      failure(
        code,
        code === 'ACCOUNT_LOCKED' ? 'Account is temporarily locked' : 'Invalid credentials',
        id,
      ),
      { status },
    );
  }
}
