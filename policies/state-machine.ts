import type { RecoveryActionState } from './types';

const transitions: Record<RecoveryActionState, readonly RecoveryActionState[]> = {
  RECOMMENDED: ['POLICY_BLOCKED', 'RISK_BLOCKED', 'NEEDS_APPROVAL', 'APPROVED', 'CANCELLED'],
  POLICY_BLOCKED: ['RECOMMENDED', 'CANCELLED'],
  RISK_BLOCKED: ['CANCELLED'],
  NEEDS_APPROVAL: ['APPROVED', 'CANCELLED'],
  APPROVED: ['EXECUTING', 'CANCELLED'],
  EXECUTING: ['COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: [],
  FAILED: ['RECOMMENDED', 'CANCELLED'],
  CANCELLED: [],
};

export function canTransition(from: RecoveryActionState, to: RecoveryActionState): boolean {
  return transitions[from].includes(to);
}

export function transitionAction(
  from: RecoveryActionState,
  to: RecoveryActionState,
): RecoveryActionState {
  if (!canTransition(from, to))
    throw new Error(`Invalid recovery action transition: ${from} -> ${to}`);
  return to;
}
