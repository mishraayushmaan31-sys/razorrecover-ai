import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

export const SUPPORTED_WEBHOOK_EVENTS = [
  'payment.authorized',
  'order.paid',
  'payment.failed',
  'payment_link.created',
  'recovery.started',
  'recovery.completed',
  'recovery.failed',
  'risk.blocked',
  'human_review.created',
] as const;

export type SupportedWebhookEvent = (typeof SUPPORTED_WEBHOOK_EVENTS)[number];
export type WebhookInput = {
  merchantId: string;
  source: 'razorpay' | 'internal';
  eventId: string;
  eventType: string;
  signatureValid: boolean;
  payload: Record<string, unknown>;
  occurredAt?: Date;
};

const paymentStatusRank: Record<string, number> = {
  FAILED: 0,
  PENDING: 1,
  AUTHORIZED: 2,
  CAPTURED: 3,
  REFUNDED: 4,
  PARTIALLY_REFUNDED: 4,
};

export function isSupportedWebhookEvent(eventType: string): eventType is SupportedWebhookEvent {
  return (SUPPORTED_WEBHOOK_EVENTS as readonly string[]).includes(eventType);
}

export function shouldApplyPaymentStatus(current: string, incoming: string): boolean {
  return (paymentStatusRank[incoming] ?? -1) >= (paymentStatusRank[current] ?? -1);
}

function providerPaymentId(payload: Record<string, unknown>): string | undefined {
  const payment = payload.payment as { entity?: { id?: string } } | undefined;
  return payment?.entity?.id;
}

function paymentAmount(payload: Record<string, unknown>): string {
  const payment = payload.payment as { entity?: { amount?: number } } | undefined;
  return ((payment?.entity?.amount ?? 0) / 100).toFixed(2);
}

function jsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
  return value as Prisma.InputJsonObject;
}

async function applyEvent(tx: Prisma.TransactionClient, event: WebhookInput): Promise<void> {
  if (!isSupportedWebhookEvent(event.eventType)) {
    throw new Error('UNKNOWN_EVENT');
  }

  const payload = event.payload;
  const opportunityId =
    typeof payload.opportunityId === 'string' ? payload.opportunityId : undefined;
  const actionId = typeof payload.actionId === 'string' ? payload.actionId : undefined;

  if (event.eventType === 'payment_link.created') return;

  if (
    event.eventType === 'payment.authorized' ||
    event.eventType === 'payment.failed' ||
    event.eventType === 'order.paid'
  ) {
    const externalId = providerPaymentId(payload);
    if (!externalId) throw new Error('PAYMENT_REFERENCE_REQUIRED');
    const payment = await tx.payment.findFirst({
      where: { merchantId: event.merchantId, providerPaymentId: externalId, isDeleted: false },
    });
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    const incoming =
      event.eventType === 'payment.failed'
        ? 'FAILED'
        : event.eventType === 'payment.authorized'
          ? 'AUTHORIZED'
          : 'CAPTURED';
    if (shouldApplyPaymentStatus(payment.status, incoming)) {
      await tx.payment.update({ where: { id: payment.id }, data: { status: incoming } });
    }
    if (event.eventType === 'order.paid') {
      await tx.revenueLedger.createMany({
        skipDuplicates: true,
        data: {
          merchantId: event.merchantId,
          paymentId: payment.id,
          entryType: 'REVENUE_RECOVERED',
          direction: 'CREDIT',
          amount: paymentAmount(payload),
          currency: payment.currency,
          description: 'Revenue posted from verified payment webhook',
          referenceId: `payment:${payment.id}:captured`,
        },
      });
    }
    return;
  }

  if (event.eventType === 'recovery.started' && opportunityId) {
    await tx.recoveryOpportunity.updateMany({
      where: { id: opportunityId, merchantId: event.merchantId },
      data: { status: 'EVALUATING' },
    });
  } else if (event.eventType === 'recovery.completed' && opportunityId) {
    await tx.recoveryOpportunity.updateMany({
      where: { id: opportunityId, merchantId: event.merchantId },
      data: { status: 'RECOVERED' },
    });
    await tx.revenueLedger.createMany({
      skipDuplicates: true,
      data: {
        merchantId: event.merchantId,
        opportunityId,
        entryType: 'REVENUE_RECOVERED',
        direction: 'CREDIT',
        amount: typeof payload.amount === 'string' ? payload.amount : '0.00',
        currency: 'INR',
        description: 'Revenue recovered from internal recovery event',
        referenceId: `opportunity:${opportunityId}:completed`,
      },
    });
  } else if (event.eventType === 'recovery.failed' && actionId) {
    await tx.recoveryAction.updateMany({
      where: { id: actionId, merchantId: event.merchantId },
      data: {
        status: 'FAILED',
        reason: typeof payload.reason === 'string' ? payload.reason : 'Recovery failed',
      },
    });
  } else if (event.eventType === 'risk.blocked' && opportunityId) {
    await tx.recoveryOpportunity.updateMany({
      where: { id: opportunityId, merchantId: event.merchantId },
      data: { status: 'REJECTED' },
    });
  } else if (event.eventType === 'human_review.created') {
    const reviewerUserId =
      typeof payload.reviewerUserId === 'string' ? payload.reviewerUserId : undefined;
    const resourceId = typeof payload.resourceId === 'string' ? payload.resourceId : opportunityId;
    if (!reviewerUserId || !resourceId) throw new Error('REVIEW_REFERENCE_REQUIRED');
    await tx.humanReview.create({
      data: {
        merchantId: event.merchantId,
        resourceType:
          typeof payload.resourceType === 'string' ? payload.resourceType : 'RecoveryOpportunity',
        resourceId,
        reviewerUserId,
        status: 'PENDING',
      },
    });
  }
}

export async function processWebhookEvent(client: PrismaClient, event: WebhookInput) {
  if (!event.signatureValid) throw new Error('INVALID_WEBHOOK_SIGNATURE');
  if (!isSupportedWebhookEvent(event.eventType)) throw new Error('UNKNOWN_EVENT');

  let record;
  try {
    record = await client.webhookEvent.create({
      data: {
        merchantId: event.merchantId,
        source: event.source,
        eventType: event.eventType,
        providerEventId: event.eventId,
        signatureValid: true,
        processingStatus: 'processing',
        dedupeKey: event.eventId,
        payload: jsonObject(event.payload),
        idempotencyKey: event.eventId,
        ...(event.occurredAt ? { createdAt: event.occurredAt } : {}),
      },
    });
  } catch (error) {
    if (
      (error instanceof Prisma.PrismaClientKnownRequestError ||
        (typeof error === 'object' && error !== null && 'code' in error)) &&
      (error as { code?: string }).code === 'P2002'
    ) {
      const existing = await client.webhookEvent.findUnique({
        where: { merchantId_dedupeKey: { merchantId: event.merchantId, dedupeKey: event.eventId } },
      });
      if (
        !existing ||
        existing.processingStatus === 'processed' ||
        existing.processingStatus === 'dead_letter'
      ) {
        logger.info('Duplicate webhook ignored', {
          merchantId: event.merchantId,
          eventId: event.eventId,
        });
        return { status: 'duplicate' as const, eventId: event.eventId };
      }
      record = existing;
    } else {
      throw error;
    }
  }

  try {
    await client.$transaction(async (tx) => {
      await applyEvent(tx, event);
      await tx.webhookEvent.update({
        where: { id: record.id },
        data: {
          processingStatus: 'processed',
          processedAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          merchantId: event.merchantId,
          resourceType: 'WEBHOOK_EVENT',
          resourceId: record.id,
          action: 'SYNC',
          newValues: jsonObject({ eventType: event.eventType, eventId: event.eventId }),
        },
      });
    });
    return { status: 'processed' as const, eventId: event.eventId };
  } catch (error) {
    const attemptCount = record.attemptCount + 1;
    const deadLettered = attemptCount >= 3;
    await client.webhookEvent.update({
      where: { id: record.id },
      data: {
        processingStatus: deadLettered ? 'dead_letter' : 'retryable',
        attemptCount,
        lastError: error instanceof Error ? error.message : 'unknown error',
        nextRetryAt: deadLettered ? null : new Date(Date.now() + attemptCount * 60_000),
        ...(deadLettered ? { deadLetteredAt: new Date() } : {}),
      },
    });
    logger.error('Webhook processing failed', {
      merchantId: event.merchantId,
      eventId: event.eventId,
      attemptCount,
      deadLettered,
    });
    return {
      status: deadLettered ? ('dead_letter' as const) : ('retryable' as const),
      eventId: event.eventId,
      attemptCount,
    };
  }
}
