import { NextRequest } from 'next/server';
import { scaffoldGet } from '@/server/resource-api';
export async function GET(request: NextRequest) {
  return scaffoldGet(request, undefined, 'audit');
}
