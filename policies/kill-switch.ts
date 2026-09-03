import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function isAiKillSwitchActive(
  client: PrismaClient,
  merchantId: string,
): Promise<boolean> {
  const merchant = await client.merchant.findUnique({
    where: { id: merchantId },
    select: { aiKillSwitchActive: true },
  });
  return merchant?.aiKillSwitchActive ?? false;
}

export async function setAiKillSwitch(
  client: PrismaClient,
  merchantId: string,
  userId: string,
  active: boolean,
) {
  const result = await client.$transaction(async (tx) => {
    const merchant = await tx.merchant.update({
      where: { id: merchantId },
      data: {
        aiKillSwitchActive: active,
        aiKillSwitchActivatedAt: active ? new Date() : null,
        aiKillSwitchActivatedBy: active ? userId : null,
      },
      select: { id: true, aiKillSwitchActive: true, aiKillSwitchActivatedAt: true },
    });
    await tx.auditLog.create({
      data: {
        merchantId,
        userId,
        resourceType: 'AI_KILL_SWITCH',
        resourceId: merchantId,
        action: 'UPDATE',
        newValues: { active, reason: active ? 'activated' : 'deactivated' },
      },
    });
    return merchant;
  });
  logger.warn('AI kill switch changed', { merchantId, userId, active });
  return {
    ...result,
    label: 'AI KILL SWITCH',
    automaticActionsDisabled: result.aiKillSwitchActive,
    paymentExecutionDisabled: result.aiKillSwitchActive,
    customerOutreachDisabled: result.aiKillSwitchActive,
    analyticsEnabled: true,
    recommendationsEnabled: true,
  };
}
