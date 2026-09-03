import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PERMISSIONS } from '@/auth/permissions';
import { protect, jsonBody, responseFailure, responseSuccess } from '@/server/api-helpers';
import { orchestrate, type AgentContext } from '@/agents';
import { evaluateAgentRun, logAgentRun } from '@/agents/logging';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  objective: z.string().trim().min(1).max(500),
  input: z.record(z.unknown()).default({}),
});

export async function POST(request: NextRequest) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;
  const parsed = requestSchema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid orchestration request', guard.id, 400);
  const context: AgentContext = {
    merchantId: guard.session.merchantId,
    mode: 'DEMO',
    correlationId: guard.id,
    actorUserId: guard.session.userId,
    input: { objective: parsed.data.objective, ...parsed.data.input },
  };
  const result = await orchestrate(context, async (_agentName, agentContext) => ({
    confidence: 0,
    ...(agentContext.input.agentOutput as Record<string, unknown> | undefined),
  }));
  result.runs.forEach((run) => logAgentRun(run, guard.id, guard.session.merchantId));
  return responseSuccess(
    { ...result, evaluations: result.runs.map(evaluateAgentRun) },
    guard.id,
    200,
  );
}
