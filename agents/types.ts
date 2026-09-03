import type { z } from 'zod';

export type AgentName =
  | 'detection'
  | 'diagnosis'
  | 'recovery'
  | 'risk'
  | 'finance'
  | 'escalation'
  | 'learning'
  | 'merchant_copilot'
  | 'orchestrator';

export type AgentPermission =
  | 'payments:read'
  | 'customers:read'
  | 'risk:read'
  | 'recovery:recommend'
  | 'finance:read'
  | 'policy:read'
  | 'approval:request'
  | 'memory:read'
  | 'memory:write'
  | 'audit:write';

export type MemoryAccess = 'none' | 'merchant-scoped-read' | 'merchant-scoped-write';

export type AgentContext = {
  merchantId: string;
  mode: 'DEMO' | 'TEST' | 'PRODUCTION';
  correlationId: string;
  actorUserId?: string;
  input: Record<string, unknown>;
};

export type AgentTool = {
  name: string;
  description: string;
  permission: AgentPermission;
  execute: (context: AgentContext, input: unknown) => Promise<unknown>;
};

export type AgentDefinition<TOutput> = {
  name: AgentName;
  responsibility: string;
  inputs: string[];
  outputs: string[];
  tools: string[];
  permissions: AgentPermission[];
  context: string;
  memoryAccess: MemoryAccess;
  failureBehavior: string;
  safetyLimits: string[];
  minimumConfidence: number;
  promptVersion: string;
  outputSchema: z.ZodType<TOutput>;
  fallback: (context: AgentContext, reason: string) => TOutput;
};

export type AgentRun<TOutput> = {
  agent: AgentName;
  promptVersion: string;
  output: TOutput;
  confidence: number;
  usedFallback: boolean;
  failureReason?: string;
};

export type GatedOrchestrationResult = {
  correlationId: string;
  status: 'RECOMMENDATION_READY' | 'REVIEW_REQUIRED' | 'BLOCKED';
  stages: {
    policy: 'PENDING' | 'PASSED' | 'FAILED';
    riskGate: 'PENDING' | 'PASSED' | 'FAILED';
    approval: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    execution: 'BLOCKED';
  };
  runs: AgentRun<unknown>[];
  safetyNotice: 'AI output is untrusted input; deterministic execution is required.';
};
