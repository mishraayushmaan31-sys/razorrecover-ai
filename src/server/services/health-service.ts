import { prisma } from '@/database/client';
import { serverEnv } from '@/env';
import type { HealthData } from '@/types/api';

export async function getHealth(): Promise<HealthData> {
  await prisma.$queryRaw`SELECT 1`;

  return {
    app: 'ok',
    database: 'ok',
    environment: serverEnv.APP_ENV,
    timestamp: new Date().toISOString(),
  };
}
