import { NextResponse } from 'next/server';
import { failure, success } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { requestId } from '@/lib/request-id';
import { getHealth } from '@/server/services/health-service';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const id = requestId();

  try {
    const health = await getHealth();
    return NextResponse.json(success(health, id), { status: 200 });
  } catch (error) {
    logger.error('Health check failed', {
      requestId: id,
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return NextResponse.json(failure('DATABASE_UNAVAILABLE', 'Database is unavailable', id), {
      status: 503,
    });
  }
}
