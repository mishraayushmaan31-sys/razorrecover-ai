export { disconnectDatabase, prisma } from './client.js';
export * from './utils/financial.js';

export const DATABASE_MODE = {
  DEMO: 'DEMO',
  TEST: 'TEST',
  PRODUCTION: 'PRODUCTION',
} as const;

export function ensureSafeTenantScope(tenant: string): string {
  const trimmed = tenant.trim();
  if (!trimmed) {
    throw new Error('Tenant scope is required');
  }

  return trimmed.toLowerCase();
}
