import { NextResponse } from 'next/server';
import { signup } from '@/auth/auth-service';
import { signupSchema } from '@/auth/schemas';
import { createSessionToken, setSessionCookie } from '@/auth/session';
import { failure, success } from '@/lib/api-response';
import { requestId } from '@/lib/request-id';

export async function POST(request: Request): Promise<NextResponse> {
  const id = requestId();
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(failure('VALIDATION_ERROR', 'Invalid signup details', id), {
      status: 400,
    });
  }

  try {
    const result = await signup(parsed.data);
    const token = await createSessionToken(result);
    await setSessionCookie(token);
    return NextResponse.json(
      success({ userId: result.userId, merchantId: result.merchantId, role: result.role }, id),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        failure('ACCOUNT_EXISTS', 'Merchant details are already registered', id),
        { status: 409 },
      );
    }
    return NextResponse.json(failure('SIGNUP_FAILED', 'Unable to create account', id), {
      status: 500,
    });
  }
}
