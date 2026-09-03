import { agentDefinitions } from './definitions';
import type { AgentContext, AgentRun, GatedOrchestrationResult } from './types';

export type AgentRunner = (agent: string, context: AgentContext) => Promise<unknown>;

export async function runValidatedAgent(
  agentName: string,
  context: AgentContext,
  runner: AgentRunner,
): Promise<AgentRun<unknown>> {
  const definition = agentDefinitions[agentName];
  if (!definition) throw new Error(`UNKNOWN_AGENT:${agentName}`);

  try {
    const rawOutput = await runner(agentName, context);
    const output = definition.outputSchema.parse(rawOutput);
    const confidence =
      typeof output === 'object' &&
      output !== null &&
      'confidence' in output &&
      typeof output.confidence === 'number'
        ? output.confidence
        : 0;
    if (confidence < definition.minimumConfidence) {
      return {
        agent: definition.name,
        promptVersion: definition.promptVersion,
        output: definition.fallback(context, 'confidence_below_threshold'),
        confidence: 0,
        usedFallback: true,
        failureReason: 'confidence_below_threshold',
      };
    }
    return {
      agent: definition.name,
      promptVersion: definition.promptVersion,
      output,
      confidence,
      usedFallback: false,
    };
  } catch (error) {
    return {
      agent: definition.name,
      promptVersion: definition.promptVersion,
      output: definition.fallback(
        context,
        error instanceof Error ? error.message : 'agent_failure',
      ),
      confidence: 0,
      usedFallback: true,
      failureReason: error instanceof Error ? error.message : 'agent_failure',
    };
  }
}

export async function orchestrate(
  context: AgentContext,
  runner: AgentRunner,
): Promise<GatedOrchestrationResult> {
  const selectedAgents = ['detection', 'diagnosis', 'risk', 'recovery', 'finance', 'escalation'];
  const runs: AgentRun<unknown>[] = [];
  for (const agent of selectedAgents) runs.push(await runValidatedAgent(agent, context, runner));

  const riskRun = runs.find((run) => run.agent === 'risk');
  const riskOutput = riskRun?.output as
    { assessments?: Array<{ decision: string }>; confidence?: number } | undefined;
  const hasFallback = runs.some((run) => run.usedFallback);
  const requiresReview =
    hasFallback ||
    (riskOutput?.assessments?.some(
      (assessment) => assessment.decision !== 'ALLOW_RECOMMENDATION',
    ) ??
      true);

  return {
    correlationId: context.correlationId,
    status: hasFallback || requiresReview ? 'REVIEW_REQUIRED' : 'RECOMMENDATION_READY',
    stages: {
      policy: 'PENDING',
      riskGate: 'PENDING',
      approval: requiresReview ? 'PENDING' : 'NOT_REQUIRED',
      execution: 'BLOCKED',
    },
    runs,
    safetyNotice: 'AI output is untrusted input; deterministic execution is required.',
  };
}
