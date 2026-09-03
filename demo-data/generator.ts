import { AppMode, Prisma, PrismaClient } from '@prisma/client';

export const DEMO_MERCHANT_ID = 'merchant-demo-001';
export const DEMO_COUNTS = {
  paymentAttempts: 10_000,
  failed: 1_800,
  retryable: 700,
  abandoned: 450,
  highValueCustomers: 200,
  recoveredAmount: 310_000,
};

const atRiskCount = DEMO_COUNTS.failed + DEMO_COUNTS.retryable + DEMO_COUNTS.abandoned;
const failureReasons = [
  'insufficient_funds',
  'network_timeout',
  'authentication_failed',
  'bank_declined',
  'customer_abandoned',
];

function id(prefix: string, index: number): string {
  return `${prefix}-demo-${String(index).padStart(5, '0')}`;
}

function amountFor(index: number): string {
  return (200 + ((index * 29) % 200)).toFixed(2);
}

function statusFor(index: number): {
  status: 'FAILED' | 'PENDING' | 'EXPIRED' | 'CAPTURED';
  classification: string;
} {
  if (index < DEMO_COUNTS.failed) return { status: 'FAILED', classification: 'failed' };
  if (index < DEMO_COUNTS.failed + DEMO_COUNTS.retryable)
    return { status: 'PENDING', classification: 'retryable' };
  if (index < atRiskCount) return { status: 'EXPIRED', classification: 'abandoned' };
  return { status: 'CAPTURED', classification: 'successful' };
}

export function buildDemoCustomers(
  merchantId = DEMO_MERCHANT_ID,
): Prisma.CustomerCreateManyInput[] {
  return Array.from({ length: DEMO_COUNTS.highValueCustomers }, (_, index) => ({
    id: id('customer', index + 1),
    merchantId,
    externalId: `demo-customer-${index + 1}`,
    name: `Demo Customer ${String(index + 1).padStart(3, '0')}`,
    email: `customer${index + 1}@demo.razorrecover.local`,
    phone: `+9190000${String(index + 1).padStart(5, '0')}`,
    status: 'ACTIVE',
    riskScore: ((index * 7) % 45).toFixed(2),
    metadata: {
      label: 'DEMO MODE',
      segment: 'high_value',
      lifetimeValue: (25_000 + index * 1_250).toFixed(2),
    },
  }));
}

export function buildDemoOrders(merchantId = DEMO_MERCHANT_ID): Prisma.OrderCreateManyInput[] {
  return Array.from({ length: DEMO_COUNTS.paymentAttempts }, (_, index) => {
    const state = statusFor(index);
    return {
      id: id('order', index + 1),
      merchantId,
      customerId: id('customer', (index % DEMO_COUNTS.highValueCustomers) + 1),
      orderNumber: `DEMO-${String(index + 1).padStart(6, '0')}`,
      status:
        state.status === 'CAPTURED' ? 'PAID' : state.status === 'EXPIRED' ? 'FAILED' : 'CREATED',
      amount: amountFor(index),
      currency: 'INR',
      idempotencyKey: `demo-order-key-${index + 1}`,
      metadata: { label: 'DEMO MODE', simulated: true, classification: state.classification },
    };
  });
}

export function buildDemoTransactions(
  merchantId = DEMO_MERCHANT_ID,
): Prisma.TransactionCreateManyInput[] {
  return Array.from({ length: DEMO_COUNTS.paymentAttempts }, (_, index) => {
    const state = statusFor(index);
    return {
      id: id('transaction', index + 1),
      merchantId,
      customerId: id('customer', (index % DEMO_COUNTS.highValueCustomers) + 1),
      orderId: id('order', index + 1),
      type: 'PAYMENT',
      status:
        state.status === 'CAPTURED'
          ? 'SUCCEEDED'
          : state.status === 'EXPIRED'
            ? 'FAILED'
            : state.status,
      amount: amountFor(index),
      currency: 'INR',
      idempotencyKey: `demo-transaction-key-${index + 1}`,
      metadata: { label: 'DEMO MODE', classification: state.classification },
    };
  });
}

export function buildDemoPayments(merchantId = DEMO_MERCHANT_ID): Prisma.PaymentCreateManyInput[] {
  return Array.from({ length: DEMO_COUNTS.paymentAttempts }, (_, index) => {
    const state = statusFor(index);
    return {
      id: id('payment', index + 1),
      merchantId,
      customerId: id('customer', (index % DEMO_COUNTS.highValueCustomers) + 1),
      orderId: id('order', index + 1),
      transactionId: id('transaction', index + 1),
      provider: 'demo-provider',
      providerPaymentId: `demo-pay-${index + 1}`,
      status:
        state.status === 'CAPTURED'
          ? 'CAPTURED'
          : state.status === 'EXPIRED'
            ? 'FAILED'
            : 'PENDING',
      amount: amountFor(index),
      currency: 'INR',
      idempotencyKey: `demo-payment-key-${index + 1}`,
      gatewayData: { label: 'DEMO MODE', simulated: true },
      metadata: { label: 'DEMO MODE', classification: state.classification },
    };
  });
}

export function buildDemoAttempts(
  merchantId = DEMO_MERCHANT_ID,
): Prisma.PaymentAttemptCreateManyInput[] {
  return Array.from({ length: DEMO_COUNTS.paymentAttempts }, (_, index) => {
    const state = statusFor(index);
    return {
      id: id('attempt', index + 1),
      merchantId,
      orderId: id('order', index + 1),
      paymentId: id('payment', index + 1),
      attemptNumber: 1,
      status:
        state.status === 'CAPTURED'
          ? 'CAPTURED'
          : state.status === 'EXPIRED'
            ? 'EXPIRED'
            : state.status,
      amount: amountFor(index),
      currency: 'INR',
      provider: 'demo-provider',
      providerAttemptId: `demo-attempt-${index + 1}`,
      gatewayResponseCode:
        state.classification === 'successful'
          ? 'SUCCESS'
          : failureReasons[index % failureReasons.length],
      idempotencyKey: `demo-attempt-key-${index + 1}`,
      metadata: {
        label: 'DEMO MODE',
        simulated: true,
        classification: state.classification,
        failureReason: failureReasons[index % failureReasons.length],
      },
    };
  });
}

export function buildDemoOpportunities(
  merchantId = DEMO_MERCHANT_ID,
): Prisma.RecoveryOpportunityCreateManyInput[] {
  return Array.from({ length: atRiskCount }, (_, index) => {
    const amount = amountFor(index);
    const recovered = index < 1_100;
    return {
      id: id('opportunity', index + 1),
      merchantId,
      customerId: id('customer', (index % DEMO_COUNTS.highValueCustomers) + 1),
      transactionId: id('transaction', index + 1),
      paymentId: id('payment', index + 1),
      orderId: id('order', index + 1),
      status: recovered ? 'RECOVERED' : 'IDENTIFIED',
      estimatedAmount: amount,
      recommendedAmount: recovered ? (Number(amount) * 0.65).toFixed(2) : amount,
      reason: `Demo ${failureReasons[index % failureReasons.length]} recovery opportunity`,
      riskScore: ((index * 11) % 90).toFixed(2),
      aiScore: ((index * 13) % 95).toFixed(2),
      idempotencyKey: `demo-opportunity-key-${index + 1}`,
      metadata: { label: 'DEMO MODE', recovered },
    };
  });
}

export function buildDemoActions(
  merchantId = DEMO_MERCHANT_ID,
): Prisma.RecoveryActionCreateManyInput[] {
  const recoveredAmountInPaise = DEMO_COUNTS.recoveredAmount * 100;
  return Array.from({ length: 1_100 }, (_, index) => {
    const cents =
      Math.floor(recoveredAmountInPaise / 1_100) + (index < recoveredAmountInPaise % 1_100 ? 1 : 0);
    return {
      id: id('action', index + 1),
      merchantId,
      opportunityId: id('opportunity', index + 1),
      type: 'RETRY_PAYMENT',
      status: 'SUCCEEDED',
      requestedAmount: (cents / 100).toFixed(2),
      executedAmount: (cents / 100).toFixed(2),
      idempotencyKey: `demo-action-key-${index + 1}`,
      reason: 'Deterministic demo recovery execution',
      metadata: { label: 'DEMO MODE', simulated: true },
    };
  });
}

export async function resetDemoData(client: PrismaClient): Promise<void> {
  await client.merchant.deleteMany({ where: { mode: AppMode.DEMO } });
}

export async function initializeDemoData(
  client: PrismaClient,
): Promise<{ merchantId: string; counts: typeof DEMO_COUNTS; revenueAtRisk: string }> {
  await resetDemoData(client);
  await client.merchant.create({
    data: {
      id: DEMO_MERCHANT_ID,
      name: 'RazorRecover Demo Merchant',
      slug: 'demo-merchant',
      mode: AppMode.DEMO,
      status: 'active',
      metadata: { label: 'DEMO MODE', deterministic: true },
    },
  });
  await client.role.createMany({
    data: [
      { id: 'role-demo-owner', merchantId: DEMO_MERCHANT_ID, name: 'OWNER', type: 'OWNER' },
      {
        id: 'role-demo-finance',
        merchantId: DEMO_MERCHANT_ID,
        name: 'FINANCE_MANAGER',
        type: 'FINANCE_MANAGER',
      },
      {
        id: 'role-demo-operations',
        merchantId: DEMO_MERCHANT_ID,
        name: 'OPERATIONS_MANAGER',
        type: 'OPERATIONS_MANAGER',
      },
      {
        id: 'role-demo-developer',
        merchantId: DEMO_MERCHANT_ID,
        name: 'DEVELOPER',
        type: 'DEVELOPER',
      },
      { id: 'role-demo-viewer', merchantId: DEMO_MERCHANT_ID, name: 'VIEWER', type: 'VIEWER' },
    ],
  });
  await client.user.create({
    data: {
      id: 'user-demo-admin',
      merchantId: DEMO_MERCHANT_ID,
      roleId: 'role-demo-owner',
      email: 'demo.owner@razorrecover.local',
      name: 'Demo Owner',
      passwordHash: '$2a$12$5dQ1uZ0w9D0v3pD8FqJ6T.7k3vQ2j5Uq5r4m2n7M3Jw4Q5G6H7I8K',
      status: 'ACTIVE',
    },
  });
  await client.customer.createMany({ data: buildDemoCustomers() });
  await client.order.createMany({ data: buildDemoOrders() });
  await client.transaction.createMany({ data: buildDemoTransactions() });
  await client.payment.createMany({ data: buildDemoPayments() });
  await client.paymentAttempt.createMany({ data: buildDemoAttempts() });
  await client.recoveryOpportunity.createMany({ data: buildDemoOpportunities() });
  await client.recoveryAction.createMany({ data: buildDemoActions() });
  await client.incident.createMany({
    data: Array.from({ length: 30 }, (_, index) => ({
      id: id('incident', index + 1),
      merchantId: DEMO_MERCHANT_ID,
      title: `Demo incident ${index + 1}`,
      description: 'Synthetic payment recovery incident',
      severity: index % 4 === 0 ? 'HIGH' : 'MEDIUM',
      metadata: { label: 'DEMO MODE' },
    })),
  });
  await client.webhookEvent.createMany({
    data: Array.from({ length: 100 }, (_, index) => ({
      id: id('webhook', index + 1),
      merchantId: DEMO_MERCHANT_ID,
      source: 'demo-provider',
      eventType: 'payment.failed',
      providerEventId: `demo-event-${index + 1}`,
      signatureValid: true,
      processingStatus: 'processed',
      dedupeKey: `demo-dedupe-${index + 1}`,
      payload: { label: 'DEMO MODE', simulated: true },
    })),
  });
  await client.humanReview.createMany({
    data: Array.from({ length: 50 }, (_, index) => ({
      id: id('review', index + 1),
      merchantId: DEMO_MERCHANT_ID,
      resourceType: 'RecoveryOpportunity',
      resourceId: id('opportunity', index + 1),
      reviewerUserId: 'user-demo-admin',
      status: 'APPROVED',
      decision: 'approved-demo',
      reason: 'Synthetic demo review',
    })),
  });
  await client.auditLog.createMany({
    data: Array.from({ length: 100 }, (_, index) => ({
      id: id('audit', index + 1),
      merchantId: DEMO_MERCHANT_ID,
      resourceType: 'DEMO_SCENARIO',
      resourceId: DEMO_MERCHANT_ID,
      action: 'CREATE',
      newValues: { label: 'DEMO MODE', event: index + 1 },
    })),
  });
  await client.revenueLedger.createMany({
    data: Array.from({ length: 1_100 }, (_, index) => ({
      id: id('ledger', index + 1),
      merchantId: DEMO_MERCHANT_ID,
      paymentId: id('payment', index + 1),
      opportunityId: id('opportunity', index + 1),
      entryType: 'REVENUE_RECOVERED',
      direction: 'CREDIT',
      amount: (
        ((DEMO_COUNTS.recoveredAmount * 100) / 1_100 +
          (index < (DEMO_COUNTS.recoveredAmount * 100) % 1_100 ? 1 : 0)) /
        100
      ).toFixed(2),
      currency: 'INR',
      description: 'Deterministic demo recovered revenue',
      referenceId: `demo-recovery-${index + 1}`,
    })),
  });
  return { merchantId: DEMO_MERCHANT_ID, counts: DEMO_COUNTS, revenueAtRisk: '850000.00' };
}
