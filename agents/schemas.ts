import { z } from 'zod';

export const confidenceSchema = z.number().min(0).max(1);
export const evidenceSchema = z
  .array(z.object({ source: z.string().min(1), detail: z.string().min(1) }))
  .max(20);

export const detectionOutputSchema = z.object({
  findings: z
    .array(
      z.object({
        type: z.enum([
          'payment_failure',
          'checkout_abandonment',
          'subscription_failure',
          'high_value_customer',
        ]),
        resourceId: z.string().min(1),
        evidence: evidenceSchema,
      }),
    )
    .max(100),
  confidence: confidenceSchema,
});
export type DetectionOutput = z.infer<typeof detectionOutputSchema>;

export const diagnosisOutputSchema = z.object({
  diagnoses: z
    .array(
      z.object({
        resourceId: z.string().min(1),
        cause: z.string().min(1).max(500),
        evidence: evidenceSchema,
        confidence: confidenceSchema,
      }),
    )
    .max(100),
  confidence: confidenceSchema,
});
export type DiagnosisOutput = z.infer<typeof diagnosisOutputSchema>;

export const recoveryOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        resourceId: z.string().min(1),
        action: z.enum(['RETRY_PAYMENT', 'SEND_NOTIFICATION', 'REQUEST_HUMAN_REVIEW']),
        rationale: z.string().min(1).max(500),
        estimatedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        confidence: confidenceSchema,
      }),
    )
    .max(100),
  confidence: confidenceSchema,
});
export type RecoveryOutput = z.infer<typeof recoveryOutputSchema>;

export const riskOutputSchema = z.object({
  assessments: z
    .array(
      z.object({
        resourceId: z.string().min(1),
        score: z.number().int().min(0).max(100),
        factors: evidenceSchema,
        decision: z.enum(['ALLOW_RECOMMENDATION', 'REQUIRE_REVIEW', 'BLOCK']),
      }),
    )
    .max(100),
  confidence: confidenceSchema,
});
export type RiskOutput = z.infer<typeof riskOutputSchema>;

export const financeOutputSchema = z.object({
  summary: z.string().max(1000),
  amounts: z
    .array(
      z.object({
        resourceId: z.string().min(1),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        currency: z.string().length(3),
      }),
    )
    .max(100),
  confidence: confidenceSchema,
});
export type FinanceOutput = z.infer<typeof financeOutputSchema>;

export const escalationOutputSchema = z.object({
  reviews: z
    .array(
      z.object({
        resourceId: z.string().min(1),
        reason: z.string().min(1).max(500),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      }),
    )
    .max(100),
  confidence: confidenceSchema,
});
export type EscalationOutput = z.infer<typeof escalationOutputSchema>;

export const learningOutputSchema = z.object({
  observations: z
    .array(
      z.object({
        key: z.string().min(1).max(120),
        observation: z.string().min(1).max(500),
        evidenceCount: z.number().int().nonnegative(),
      }),
    )
    .max(50),
  confidence: confidenceSchema,
});
export type LearningOutput = z.infer<typeof learningOutputSchema>;

export const copilotOutputSchema = z.object({
  answer: z.string().min(1).max(2000),
  citations: evidenceSchema,
  suggestedActions: z.array(z.enum(['VIEW_RISK', 'VIEW_OPPORTUNITY', 'REQUEST_REVIEW'])).max(5),
  confidence: confidenceSchema,
});
export type CopilotOutput = z.infer<typeof copilotOutputSchema>;

export const orchestratorOutputSchema = z.object({
  objective: z.string().min(1).max(500),
  selectedAgents: z.array(z.string()).max(9),
  policyCheckRequired: z.literal(true),
  riskGateRequired: z.literal(true),
  approvalRequired: z.boolean(),
  executionAllowed: z.literal(false),
  confidence: confidenceSchema,
});
export type OrchestratorOutput = z.infer<typeof orchestratorOutputSchema>;
