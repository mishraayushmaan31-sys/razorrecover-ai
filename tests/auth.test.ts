import { describe, expect, it } from 'vitest';
import { hasPermission, PERMISSIONS, ROLE_PERMISSIONS } from '../auth/permissions';
import { hashPassword, verifyPassword } from '../auth/password';
import { createSessionToken, readSessionToken } from '../auth/session';

describe('authentication and RBAC foundation', () => {
  it('defines least-privilege permissions for each role', () => {
    expect(hasPermission('OWNER', PERMISSIONS.KILL_SWITCH)).toBe(true);
    expect(hasPermission('FINANCE_MANAGER', PERMISSIONS.EXECUTE_RECOVERY)).toBe(true);
    expect(hasPermission('DEVELOPER', PERMISSIONS.EXECUTE_RECOVERY)).toBe(false);
    expect(hasPermission('VIEWER', PERMISSIONS.MANAGE_SETTINGS)).toBe(false);
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(5);
  });

  it('hashes passwords and rejects incorrect credentials', async () => {
    const password = 'SecurePass!2026';
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('signs and verifies tenant-scoped sessions', async () => {
    const token = await createSessionToken({
      userId: 'user-1',
      merchantId: 'merchant-1',
      role: 'OWNER',
    });
    await expect(readSessionToken(token)).resolves.toEqual({
      userId: 'user-1',
      merchantId: 'merchant-1',
      role: 'OWNER',
    });
    await expect(readSessionToken(`${token}tampered`)).resolves.toBeNull();
  });
});
