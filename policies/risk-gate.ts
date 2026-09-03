import { evaluatePolicy } from './engine';
import type { MerchantPolicy, RecoveryActionRequest, RecoveryActionState } from './types';

export type RiskGateInput = RecoveryActionRequest & {
  policy?: MerchantPolicy;
  killSwitchActive?: boolean;
  approvalDecision?: 'APPROVED' | 'REJECTED' | 'PENDING';
};

export type RiskGateResult = {
  state: RecoveryActionState;
  policy: ReturnType<typeof evaluatePolicy>;
  risk: { passed: boolean; reasons: string[] };
  approval: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  executionAuthorized: false;
  safetyNotice: 'AI recommendations never authorize execution.';
};

export function evaluateRiskGate(input: RiskGateInput): RiskGateResult {
  const policy = evaluatePolicy(input, input.policy, input.killSwitchActive);
  if (policy.decision === 'BLOCK')
    return {
      state: 'POLICY_BLOCKED',
      policy,
      risk: { passed: false, reasons: ['Policy blocked action.'] },
      approval: 'NOT_REQUIRED',
      executionAuthorized: false,
      safetyNotice: 'AI recommendations never authorize execution.',
    };
  if (input.riskScore >= 80)
    return {
      state: 'RISK_BLOCKED',
      policy,
      risk: { passed: false, reasons: ['Risk score is at or above the critical threshold.'] },
      approval: 'NOT_REQUIRED',
      executionAuthorized: false,
      safetyNotice: 'AI recommendations never authorize execution.',
    };
  if (policy.decision === 'REQUIRE_REVIEW') {
    const approval = input.approvalDecision ?? 'PENDING';
    return {
      state:
        approval === 'APPROVED'
          ? 'APPROVED'
          : approval === 'REJECTED'
            ? 'CANCELLED'
            : 'NEEDS_APPROVAL',
      policy,
      risk: { passed: true, reasons: ['Risk gate passed; human approval is required.'] },
      approval,
      executionAuthorized: false,
      safetyNotice: 'AI recommendations never authorize execution.',
    };
  }
  return {
    state: 'APPROVED',
    policy,
    risk: { passed: true, reasons: ['Deterministic risk gate passed.'] },
    approval: 'NOT_REQUIRED',
    executionAuthorized: false,
    safetyNotice: 'AI recommendations never authorize execution.',
  };
}
