import { AuditAction, RoleType, UserStatus } from '@prisma/client';
import { prisma } from '@/database/client';
import { hashPassword, verifyPassword } from './password';
import { type AuthRole } from './permissions';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

type SignupInput = { merchantName: string; name: string; email: string; password: string };
type LoginInput = { merchantSlug: string; email: string; password: string };

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function securityEvent(
  merchantId: string,
  userId: string | undefined,
  action: AuditAction,
  resourceId: string,
) {
  return prisma.auditLog.create({
    data: { merchantId, userId, action, resourceType: 'AUTHENTICATION', resourceId },
  });
}

export async function signup(input: SignupInput) {
  const slug = slugify(input.merchantName);
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const merchant = await tx.merchant.create({
      data: { name: input.merchantName.trim(), slug, mode: 'DEMO' },
    });
    const role = await tx.role.create({
      data: { merchantId: merchant.id, name: 'OWNER', type: RoleType.OWNER },
    });
    const user = await tx.user.create({
      data: {
        merchantId: merchant.id,
        roleId: role.id,
        email: input.email,
        name: input.name.trim(),
        passwordHash,
        status: UserStatus.ACTIVE,
      },
      include: { role: true },
    });

    await tx.auditLog.create({
      data: {
        merchantId: merchant.id,
        userId: user.id,
        action: AuditAction.SIGNUP,
        resourceType: 'USER',
        resourceId: user.id,
      },
    });

    return {
      userId: user.id,
      merchantId: merchant.id,
      role: user.role.type as AuthRole,
      merchantSlug: merchant.slug,
    };
  });
}

export async function login(input: LoginInput) {
  const merchant = await prisma.merchant.findUnique({ where: { slug: input.merchantSlug } });
  const user = merchant
    ? await prisma.user.findFirst({
        where: { merchantId: merchant.id, email: input.email, isDeleted: false },
        include: { role: true },
      })
    : null;

  if (!merchant || !user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await securityEvent(merchant.id, user.id, AuditAction.ACCOUNT_LOCKED, user.id);
    throw new Error('ACCOUNT_LOCKED');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const lockedUntil =
      failedLoginAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
        : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts, lockedUntil },
    });
    await securityEvent(
      merchant.id,
      user.id,
      lockedUntil ? AuditAction.ACCOUNT_LOCKED : AuditAction.LOGIN_FAILED,
      user.id,
    );
    throw new Error(lockedUntil ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await securityEvent(merchant.id, user.id, AuditAction.LOGIN, user.id);
  return {
    userId: user.id,
    merchantId: merchant.id,
    role: user.role.type as AuthRole,
    merchantSlug: merchant.slug,
  };
}

export async function recordLogout(merchantId: string, userId: string): Promise<void> {
  await securityEvent(merchantId, userId, AuditAction.LOGOUT, userId);
}

export async function getCurrentUser(userId: string, merchantId: string) {
  return prisma.user.findFirst({
    where: { id: userId, merchantId, isDeleted: false, status: UserStatus.ACTIVE },
    select: {
      id: true,
      merchantId: true,
      email: true,
      name: true,
      status: true,
      role: { select: { type: true, name: true } },
    },
  });
}
