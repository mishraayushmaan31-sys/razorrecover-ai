import { describe, expect, it } from 'vitest';
import { agentDefinitions } from '../agents/definitions';
import { orchestrate, runValidatedAgent } from '../agents/orchestrator';
import { evaluateAgentRun } from '../agents/logging';

describe('multi-agent architecture', () => {
  it('defines all nine agents with safety and confidence contracts', () => {
    expect(Object.keys(agentDefinitions)).toHaveLength(9);
    for (const definition of Object.values(agentDefinitions)) {
      expect(definition.promptVersion).toMatch(/\.v1$/);
      expect(definition.minimumConfidence).toBeGreaterThanOrEqual(0);
      expect(definition.minimumConfidence).toBeLessThanOrEqual(1);
      expect(definition.safetyLimits.length).toBeGreaterThan(0);
      expect(definition.outputSchema).toBeDefined();
      expect(definition.fallback).toBeTypeOf('function');
    }
  });

  it('rejects unstructured or low-confidence output and uses a fallback', async () => {
    const result = await runValidatedAgent(
      'recovery',
      { merchantId: 'm1', mode: 'DEMO', correlationId: 'c1', input: {} },
      async () => ({ arbitraryCommand: 'transfer money', confidence: 0.99 }),
    );
    expect(result.usedFallback).toBe(true);
    expect(result.output).not.toHaveProperty('arbitraryCommand');
    expect(evaluateAgentRun(result).safetyNote).toContain('not a financial execution approval');
  });

  it('keeps orchestrator execution blocked and requires policy/risk gates', async () => {
    const result = await orchestrate(
      { merchantId: 'm1', mode: 'DEMO', correlationId: 'c1', input: {} },
      async () => ({ confidence: 0 }),
    );
    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.stages.policy).toBe('PENDING');
    expect(result.stages.riskGate).toBe('PENDING');
    expect(result.stages.approval).toBe('PENDING');
    expect(result.stages.execution).toBe('BLOCKED');
    expect(result.safetyNotice).toContain('untrusted input');
  });

  it('cannot select an unregistered agent', async () => {
    await expect(
      runValidatedAgent(
        'shell',
        { merchantId: 'm1', mode: 'DEMO', correlationId: 'c1', input: {} },
        async () => ({}),
      ),
    ).rejects.toThrow('UNKNOWN_AGENT');
  });
});
