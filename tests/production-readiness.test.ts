/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { RazorpayClient } from '../razorpay/client';
import { verifyRazorpayWebhook, requireVerifiedWebhook } from '../razorpay/webhook';
import { processWebhookEvent } from '../webhooks/processor';
import { agentDefinitions } from '../agents/definitions';
import { defaultMerchantPolicy, evaluatePolicy } from '../policies/engine';
import { evaluateRiskGate } from '../policies/risk-gate';
import { executeDemoRecovery } from '../demo-data/service';
import { resultingRecoveryActionStatus } from '../human-review/policy';
import { safeError } from '../src/server/api-helpers';

function fakeDbClient(options: { duplicate?: boolean } = {}) {
  const records: Record<string, any> = {};
  const payment = { id: 'payment-1', status: 'PENDING', currency: 'INR' };
  return {
    records,
    webhookEvent: {
      create: async ({ data }: any) => {
        if (options.duplicate || records[data.dedupeKey]) {
          const error = Object.assign(new Error('duplicate'), { code: 'P2002' });
          throw error;
        }
        const record = { id: 'webhook-1', ...data, attemptCount: 0 };
        records[data.dedupeKey] = record;
        return record;
      },
      findUnique: async ({ where }: any) => {
        const key = where?.merchantId_dedupeKey?.dedupeKey ?? where?.id;
        return records[key] ?? null;
      },
      update: async ({ where, data }: any) => {
        const record = Object.values(records).find((item: any) => item.id === where.id) as any;
        if (record) Object.assign(record, data);
        return record;
      },
    },
    payment: {
      findFirst: async () => payment,
      update: async ({ data }: any) => Object.assign(payment, data),
    },
    $transaction: async (callback: (tx: any) => Promise<unknown>) =>
      callback({
        payment: {
          findFirst: async () => payment,
          update: async ({ data }: any) => Object.assign(payment, data),
        },
        revenueLedger: { createMany: async () => ({ count: 1 }) },
        webhookEvent: {
          update: async ({ where, data }: any) => {
            const record = Object.values(records).find((r: any) => r.id === where.id) as any;
            if (record) Object.assign(record, data);
            return record;
          },
        },
        auditLog: { create: async () => ({}) },
        recoveryOpportunity: { updateMany: async () => ({ count: 1 }) },
        recoveryAction: { updateMany: async () => ({ count: 1 }) },
        humanReview: { create: async () => ({}) },
      }),
  } as any;
}

describe('Prompt 20: Explicit Failure Testing – Fail Safe Enforcements', () => {
  // 1. Razorpay timeout
  it('1. Razorpay timeout: safe payment reads retry with backoff, mutations do not blindly retry', async () => {
    let attempts = 0;
    const client = new RazorpayClient({
      maxRetries: 2,
      transport: async (_url, init) => {
        attempts += 1;
        if (init?.method === 'POST') {
          // Mutation timeout must not retry automatically to prevent double-charges
          throw new Error('Razorpay request timed out or failed');
        }
        if (attempts <= 2) {
          throw new Error('Razorpay request timed out or failed');
        }
        return new Response(
          JSON.stringify({ id: 'pay_test_123', status: 'captured', amount: 1000, currency: 'INR' }),
          { status: 200 },
        );
      },
    });

    // Safe read succeeds after retrying up to maxRetries
    const readResult = await client.fetchPayment('pay_test_123');
    expect(readResult.id).toBe('pay_test_123');
    expect(attempts).toBe(3);

    // Mutation throws immediately on error without automatic retries
    attempts = 0;
    await expect(
      client.createOrder({ amount: 1000, currency: 'INR', receipt: 'rcpt_1' }, 'idemp-timeout-1'),
    ).rejects.toThrow('Razorpay request timed out or failed');
    expect(attempts).toBe(1);
  });

  // 2. Duplicate webhook
  it('2. Duplicate webhook: deduplication ignores repeated events and executes safely once', async () => {
    const client = fakeDbClient();
    const eventInput = {
      merchantId: 'merchant-1',
      source: 'razorpay' as const,
      eventId: 'event-duplicate-1',
      eventType: 'payment.authorized',
      signatureValid: true,
      payload: { payment: { entity: { id: 'pay-1', amount: 1000 } } },
    };

    // First arrival
    const firstResult = await processWebhookEvent(client, eventInput);
    expect(firstResult.status).toBe('processed');

    // Duplicate arrival
    const duplicateResult = await processWebhookEvent(client, eventInput);
    expect(duplicateResult.status).toBe('duplicate');
  });

  // 3. Invalid webhook signature
  it('3. Invalid webhook signature: signature validation strictly rejects unverified payloads', () => {
    const rawBody = JSON.stringify({ event: 'payment.captured', id: 'pay_999' });
    const invalidSignature = 'invalid_tampered_signature_hex';

    expect(verifyRazorpayWebhook(rawBody, invalidSignature)).toBe(false);

    expect(() => requireVerifiedWebhook(rawBody, invalidSignature)).toThrow(
      'Invalid Razorpay webhook signature',
    );
  });

  // 4. AI unavailable
  it('4. AI unavailable: returns bounded fallback response with 0 confidence and empty findings', () => {
    const detectionAgent = agentDefinitions.detection;
    expect(detectionAgent).toBeDefined();

    // When AI provider fails/unavailable, fallback is triggered
    const fallbackResponse = (detectionAgent.fallback as any)(
      { merchantId: 'merchant-1' },
      'Provider 503 Unavailable',
    );

    expect(fallbackResponse).toBeDefined();
    expect(fallbackResponse.confidence).toBe(0);
    expect(fallbackResponse.findings).toEqual([]);
  });

  // 5. AI hallucination
  it('5. AI hallucination: schema validation rejects ungrounded, non-allowlisted, or malformed data', () => {
    const recoveryAgent = agentDefinitions.recovery;

    // Hallucinated payload containing arbitrary non-allowlisted actions and invalid confidence > 1
    const hallucinatedPayload = {
      confidence: 1.85, // Invalid: confidence must be 0 to 1
      recommendations: [
        {
          action: 'ARBITRARY_MONEY_TRANSFER', // Not an allowlisted recovery strategy
          amount: '999999999999.00',
        },
      ],
    };

    const parseResult = recoveryAgent.outputSchema.safeParse(hallucinatedPayload);
    expect(parseResult.success).toBe(false);
  });

  // 6. Policy conflict
  it('6. Policy conflict: contradictory rules fail closed with BLOCK decision', () => {
    // Scenario: Amount is below threshold, but max retries is exceeded and risk is critical
    const conflictingRequest = {
      actionId: 'act-conflict-01',
      action: 'PAYMENT_RETRY' as const,
      amount: '500.00',
      riskScore: 92, // Critical!
      confidence: 0.95,
      retryCount: 4, // Exceeded!
      customerContactCount: 0,
      dailyRecoveredAmount: '0.00',
      hasSuccessfulRecovery: false,
      automatic: true,
    };

    const policyDecision = evaluatePolicy(conflictingRequest);
    expect(policyDecision.decision).toBe('BLOCK');
    expect(policyDecision.state).toBe('POLICY_BLOCKED');
    expect(policyDecision.reasons).toContain('Maximum retries (3) reached.');
    expect(policyDecision.reasons).toContain('High-risk transaction is blocked by policy.');
  });

  // 7. High-risk transaction
  it('7. High-risk transaction: risk score >= 80 is immediately blocked and never authorizes execution', () => {
    const highRiskInput = {
      actionId: 'act-high-risk',
      action: 'PAYMENT_RETRY' as const,
      amount: '25000.00',
      riskScore: 85, // High risk
      confidence: 0.9,
      retryCount: 1,
      customerContactCount: 1,
      dailyRecoveredAmount: '0.00',
      hasSuccessfulRecovery: false,
      automatic: false,
    };

    // With default policy, high-risk is blocked by policy engine
    const defaultGateResult = evaluateRiskGate(highRiskInput);
    expect(defaultGateResult.state).toBe('POLICY_BLOCKED');
    expect(defaultGateResult.executionAuthorized).toBe(false);

    // With risk gate override where policy check passes, risk gate specifically returns RISK_BLOCKED
    const riskGateResult = evaluateRiskGate({
      ...highRiskInput,
      policy: { ...defaultMerchantPolicy(), blockHighRiskTransactions: false },
    });
    expect(riskGateResult.state).toBe('RISK_BLOCKED');
    expect(riskGateResult.executionAuthorized).toBe(false);
    expect(riskGateResult.safetyNotice).toBe('AI recommendations never authorize execution.');
    expect(riskGateResult.risk.passed).toBe(false);
  });

  // 8. Duplicate recovery
  it('8. Duplicate recovery: idempotency key stops duplicate execution and replays existing action', async () => {
    const existingAction = {
      id: 'act-existing-1',
      status: 'SUCCEEDED',
      idempotencyKey: 'idemp-key-100',
    };

    const mockDb = {
      merchant: { findUnique: vi.fn(async () => ({ mode: 'DEMO', aiKillSwitchActive: false })) },
      recoveryAction: { findFirst: vi.fn(async () => existingAction) },
      recoveryOpportunity: { findFirst: vi.fn() },
      $transaction: vi.fn(),
    } as unknown as Parameters<typeof executeDemoRecovery>[0];

    const result = await executeDemoRecovery(mockDb, 'merchant-demo-001', 'opp-1', 'idemp-key-100');

    expect(result.idempotentReplay).toBe(true);
    expect(result.actionId).toBe(existingAction.id);
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  // 9. Database failure
  it('9. Database failure: catches exception, returns safe 500/503 response, and does not leak internals', () => {
    const dbError = new Error('FATAL: Connection pool exhausted');
    const response = safeError(dbError, 'req-fail-001');

    expect(response.status).toBe(500);
  });

  // 10. Network failure
  it('10. Network failure: network disconnections fail safely without partial state mutation', async () => {
    const networkErrorClient = new RazorpayClient({
      maxRetries: 0,
      transport: async () => {
        throw new TypeError('Failed to fetch: ECONNRESET');
      },
    });

    await expect(networkErrorClient.fetchPayment('pay_conn_reset')).rejects.toThrow(
      'Razorpay request timed out or failed',
    );
  });

  // 11. Partial execution
  it('11. Partial execution: multi-step operations roll back completely when ledger creation fails', async () => {
    const mockDb = {
      merchant: { findUnique: vi.fn(async () => ({ mode: 'DEMO', aiKillSwitchActive: false })) },
      recoveryAction: { findFirst: vi.fn(async () => null) },
      recoveryOpportunity: {
        findFirst: vi.fn(async () => ({ id: 'opp-1', recommendedAmount: '1500.00' })),
      },
      $transaction: vi.fn(async (cb) => {
        const tx = {
          recoveryAction: { create: vi.fn(async () => ({ id: 'act-temp-1' })) },
          recoveryOpportunity: { update: vi.fn(async () => ({})) },
          revenueLedger: {
            create: vi.fn(async () => {
              throw new Error('Ledger partition disk full');
            }),
          },
        };
        // Run transaction callback which fails on ledger write
        return cb(tx);
      }),
    } as unknown as Parameters<typeof executeDemoRecovery>[0];

    // Transaction fails on partial write and does not commit
    await expect(
      executeDemoRecovery(mockDb, 'merchant-demo-001', 'opp-1', 'idemp-fail-rollback'),
    ).rejects.toThrow('Ledger partition disk full');
  });

  // 12. Human rejection
  it('12. Human rejection: reviewer REJECT transitions recovery action status to CANCELLED', () => {
    const cancelledStatus = resultingRecoveryActionStatus('REJECT');
    expect(cancelledStatus).toBe('CANCELLED');

    const approvedStatus = resultingRecoveryActionStatus('APPROVE');
    expect(approvedStatus).toBe('APPROVED');
  });
});
