import { NextRequest } from 'next/server';
import { blockedExecution } from '@/server/resource-api';
export async function POST(request: NextRequest) {
  return blockedExecution(request);
}
