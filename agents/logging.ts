import { logger } from '@/lib/logger';
import type { AgentRun } from './types';

export function logAgentRun(
  run: AgentRun<unknown>,
  correlationId: string,
  merchantId: string,
): void {
  logger.info('AI agent run completed', {
    agent: run.agent,
    promptVersion: run.promptVersion,
    correlationId,
    merchantId,
    confidence: run.confidence,
    usedFallback: run.usedFallback,
  });
}

export function evaluateAgentRun(run: AgentRun<unknown>) {
  return {
    agent: run.agent,
    promptVersion: run.promptVersion,
    confidence: run.confidence,
    fallback: run.usedFallback,
    passedSchemaValidation: !run.failureReason || run.usedFallback,
    safetyNote:
      'Evaluation covers structure and confidence only; it is not a financial execution approval.',
  };
}
