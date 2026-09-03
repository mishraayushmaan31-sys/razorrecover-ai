export const PERMISSIONS = {
  VIEW_DASHBOARD: 'dashboard:view',
  VIEW_FINANCIALS: 'financials:view',
  MANAGE_FINANCIALS: 'financials:manage',
  EXECUTE_RECOVERY: 'recovery:execute',
  MANAGE_OPERATIONS: 'operations:manage',
  MANAGE_DEVELOPMENT: 'developer:access',
  MANAGE_USERS: 'users:manage',
  MANAGE_SETTINGS: 'settings:manage',
  KILL_SWITCH: 'system:kill_switch',
  MANAGE_WEBHOOKS: 'webhooks:manage',
  VIEW_AUDIT_LOG: 'audit:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type AuthRole = 'OWNER' | 'FINANCE_MANAGER' | 'OPERATIONS_MANAGER' | 'DEVELOPER' | 'VIEWER';

export const ROLE_PERMISSIONS: Record<AuthRole, readonly Permission[]> = {
  OWNER: Object.values(PERMISSIONS),
  FINANCE_MANAGER: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.MANAGE_FINANCIALS,
    PERMISSIONS.EXECUTE_RECOVERY,
    PERMISSIONS.VIEW_AUDIT_LOG,
  ],
  OPERATIONS_MANAGER: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.MANAGE_OPERATIONS,
    PERMISSIONS.EXECUTE_RECOVERY,
    PERMISSIONS.VIEW_AUDIT_LOG,
  ],
  DEVELOPER: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.MANAGE_DEVELOPMENT,
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.VIEW_AUDIT_LOG,
  ],
  VIEWER: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_FINANCIALS],
};

export function hasPermission(role: string, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role as AuthRole] ?? []).includes(permission);
}
