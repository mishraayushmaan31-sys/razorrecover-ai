import { AppMode, PrismaClient } from '@prisma/client';
import { DEMO_MERCHANT_ID, initializeDemoData } from './generator';
import { isAiKillSwitchActive } from '../policies';

export async function requireDemoMerchant(client: PrismaClient, merchantId: string): Promise<void> {
  const merchant = await client.merchant.findUnique({
    where: { id: merchantId },
    select: { mode: true },
  });
  if (!merchant || merchant.mode !== AppMode.DEMO) {
    throw new Error('DEMO_MODE_REQUIRED');
  }
}

export async function initializeDemo(client: PrismaClient) {
  return initializeDemoData(client);
}

export async function resetDemo(client: PrismaClient, merchantId: string) {
  await requireDemoMerchant(client, merchantId);
  return initializeDemoData(client);
}

export function isDemoMode(mode: AppMode): boolean {
  return mode === AppMode.DEMO;
}

export async function selectDemoScenario(
  client: PrismaClient,
  merchantId: string,
  scenario: string,
) {
  await requireDemoMerchant(client, merchantId);
  const allowed = ['payment-failure-wave', 'retryable-recovery', 'abandoned-high-value'];
  if (!allowed.includes(scenario)) throw new Error('INVALID_SCENARIO');
  return { scenario, availableScenarios: allowed, label: 'DEMO MODE' };
}

export async function generateDemoEvent(
  client: PrismaClient,
  merchantId: string,
  eventType: string,
) {
  await requireDemoMerchant(client, merchantId);
  const allowed = ['payment.failed', 'payment.retryable', 'payment.recovered'];
  if (!allowed.includes(eventType)) throw new Error('INVALID_EVENT_TYPE');
  const sequence = await client.webhookEvent.count({ where: { merchantId } });
  return client.webhookEvent.create({
    data: {
      merchantId,
      source: 'demo-provider',
      eventType,
      providerEventId: `demo-live-event-${sequence + 1}`,
      signatureValid: true,
      processingStatus: 'processed',
      dedupeKey: `demo-live-dedupe-${sequence + 1}`,
      payload: { label: 'DEMO MODE', simulated: true, sequence: sequence + 1 },
    },
  });
}

export async function executeDemoRecovery(
  client: PrismaClient,
  merchantId: string,
  opportunityId: string,
  idempotencyKey: string,
) {
  await requireDemoMerchant(client, merchantId);
  if (await isAiKillSwitchActive(client, merchantId)) throw new Error('AI_KILL_SWITCH_ACTIVE');
  const existing = await client.recoveryAction.findFirst({ where: { merchantId, idempotencyKey } });
  if (existing)
    return {
      actionId: existing.id,
      status: existing.status,
      idempotentReplay: true,
      label: 'DEMO MODE',
    };
  const opportunity = await client.recoveryOpportunity.findFirst({
    where: { id: opportunityId, merchantId, isDeleted: false },
  });
  if (!opportunity) throw new Error('OPPORTUNITY_NOT_FOUND');
  const amount = opportunity.recommendedAmount ?? opportunity.estimatedAmount ?? '0.00';
  const result = await client.$transaction(async (tx) => {
    const action = await tx.recoveryAction.create({
      data: {
        merchantId,
        opportunityId,
        type: 'RETRY_PAYMENT',
        status: 'SUCCEEDED',
        requestedAmount: amount,
        executedAmount: amount,
        idempotencyKey,
        reason: 'Deterministic DEMO MODE execution',
        metadata: { label: 'DEMO MODE', simulated: true },
      },
    });
    await tx.recoveryOpportunity.update({
      where: { id: opportunityId },
      data: { status: 'RECOVERED' },
    });
    await tx.revenueLedger.create({
      data: {
        merchantId,
        opportunityId,
        entryType: 'REVENUE_RECOVERED',
        direction: 'CREDIT',
        amount,
        currency: opportunity.recommendedAmount ? 'INR' : 'INR',
        description: 'Deterministic demo recovery',
        referenceId: `demo-execution-${action.id}`,
      },
    });
    return action;
  });
  return {
    actionId: result.id,
    status: result.status,
    idempotentReplay: false,
    label: 'DEMO MODE',
  };
}

export { DEMO_MERCHANT_ID };
