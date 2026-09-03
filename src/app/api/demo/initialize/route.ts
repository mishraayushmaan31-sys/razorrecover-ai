import { NextRequest } from 'next/server';
import { prisma } from '@/database/client';
import { PERMISSIONS } from '@/auth/permissions';
import { protect, responseSuccess, safeError } from '@/server/api-helpers';
import { initializeDemo } from '@/demo-data/service';

export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.MANAGE_DEVELOPMENT);
  if (guard.response) return guard.response;
  try {
    return responseSuccess(await initializeDemo(prisma), guard.id, 201);
  } catch (error) {
    return safeError(error, guard.id);
  }
}
