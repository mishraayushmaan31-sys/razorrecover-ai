export const PROMPT_VERSIONS = {
  detection: 'detection.v1',
  diagnosis: 'diagnosis.v1',
  recovery: 'recovery.v1',
  risk: 'risk.v1',
  finance: 'finance.v1',
  escalation: 'escalation.v1',
  learning: 'learning.v1',
  merchant_copilot: 'copilot.v1',
  orchestrator: 'orchestrator.v1',
} as const;

export type PromptVersion = (typeof PROMPT_VERSIONS)[keyof typeof PROMPT_VERSIONS];

export function promptVersionFor(agent: keyof typeof PROMPT_VERSIONS): PromptVersion {
  return PROMPT_VERSIONS[agent];
}
