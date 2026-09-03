export type HumanReviewAction = 'APPROVE' | 'REJECT' | 'MODIFY' | 'ASSIGN' | 'ESCALATE';

export function canPerformReviewAction(role: string, action: HumanReviewAction): boolean {
  if (role === 'OWNER') return true;
  if (['FINANCE_MANAGER', 'OPERATIONS_MANAGER'].includes(role))
    return ['APPROVE', 'REJECT', 'MODIFY', 'ASSIGN', 'ESCALATE'].includes(action);
  return false;
}

export function resultingRecoveryActionStatus(
  action: HumanReviewAction,
): 'APPROVED' | 'CANCELLED' | 'NEEDS_APPROVAL' | null {
  if (action === 'APPROVE') return 'APPROVED';
  if (action === 'REJECT') return 'CANCELLED';
  if (action === 'MODIFY') return 'NEEDS_APPROVAL';
  return null;
}
