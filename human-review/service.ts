import { AuditAction, HumanReviewAction, PrismaClient, ReviewStatus } from '@prisma/client';
import {
  canPerformReviewAction,
  resultingRecoveryActionStatus,
  type HumanReviewAction as ReviewAction,
} from './policy';

function json(value: Record<string, unknown>) {
  return value as object;
}

export type ExplainabilitySnapshotInput = {
  merchantId: string;
  actionId: string;
  reviewId: string;
  transactionId?: string | null;
  customerId?: string | null;
  agent?: string;
  decision: string;
  evidence: Record<string, unknown>;
  confidence: string;
  risk: Record<string, unknown>;
  policy: Record<string, unknown>;
  approval: Record<string, unknown>;
  result: string;
  revenueRescued: string;
};

export function buildExplainabilitySnapshot(input: ExplainabilitySnapshotInput) {
  return {
    merchantId: input.merchantId,
    actionId: input.actionId,
    reviewId: input.reviewId,
    transactionId: input.transactionId ?? null,
    customerId: input.customerId ?? null,
    agent: input.agent ?? null,
    decision: input.decision,
    evidence: input.evidence,
    confidence: input.confidence,
    risk: input.risk,
    policy: input.policy,
    approval: input.approval,
    result: input.result,
    revenueRescued: input.revenueRescued,
  };
}

export async function getReviewQueue(client: PrismaClient, merchantId: string) {
  const reviews = await client.humanReview.findMany({
    where: { merchantId, status: ReviewStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  return Promise.all(
    reviews.map(async (review) => {
      const action = await client.recoveryAction.findFirst({
        where: { id: review.resourceId, merchantId, isDeleted: false },
      });
      const opportunity = action
        ? await client.recoveryOpportunity.findFirst({
            where: { id: action.opportunityId, merchantId, isDeleted: false },
            include: {
              customer: true,
              recommendations: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          })
        : null;
      const recommendation = opportunity?.recommendations[0];
      return {
        reviewId: review.id,
        actionId: action?.id ?? review.resourceId,
        aiRecommendation: recommendation?.summary ?? 'No AI recommendation persisted.',
        evidence: recommendation?.details ?? action?.metadata ?? {},
        confidence: recommendation?.confidence?.toFixed(2) ?? '0.00',
        risk: { score: opportunity?.riskScore?.toFixed(2) ?? '0.00' },
        policy: action?.metadata && typeof action.metadata === 'object' ? action.metadata : {},
        approval: {
          status: review.status,
          reviewerUserId: review.reviewerUserId,
          assignedToUserId: review.assignedToUserId,
        },
        expectedRecovery:
          opportunity?.recommendedAmount?.toFixed(2) ??
          opportunity?.estimatedAmount?.toFixed(2) ??
          '0.00',
        customerImpact: {
          customerId: opportunity?.customerId ?? null,
          segment: opportunity?.customer?.metadata ?? {},
        },
        proposedAction: action?.type ?? 'UNKNOWN',
      };
    }),
  );
}

export async function applyReviewAction(
  client: PrismaClient,
  input: {
    merchantId: string;
    reviewerUserId: string;
    reviewerRole: string;
    reviewId: string;
    action: ReviewAction;
    reason?: string;
    modifiedProposal?: Record<string, unknown>;
    assigneeUserId?: string;
  },
) {
  if (!canPerformReviewAction(input.reviewerRole, input.action))
    throw new Error('REVIEW_FORBIDDEN');
  return client.$transaction(async (tx) => {
    const review = await tx.humanReview.findFirst({
      where: { id: input.reviewId, merchantId: input.merchantId, status: ReviewStatus.PENDING },
    });
    if (!review) throw new Error('REVIEW_NOT_FOUND');
    const recoveryAction = await tx.recoveryAction.findFirst({
      where: { id: review.resourceId, merchantId: input.merchantId, isDeleted: false },
      include: { opportunity: true },
    });
    if (!recoveryAction) throw new Error('ACTION_NOT_FOUND');
    if (input.action === 'ASSIGN') {
      if (!input.assigneeUserId) throw new Error('ASSIGNEE_REQUIRED');
      const assignee = await tx.user.findFirst({
        where: { id: input.assigneeUserId, merchantId: input.merchantId, isDeleted: false },
      });
      if (!assignee) throw new Error('ASSIGNEE_NOT_FOUND');
    }
    const nextStatus = resultingRecoveryActionStatus(input.action);
    const reviewStatus =
      input.action === 'APPROVE'
        ? ReviewStatus.APPROVED
        : input.action === 'REJECT'
          ? ReviewStatus.REJECTED
          : input.action === 'ESCALATE'
            ? ReviewStatus.ESCALATED
            : ReviewStatus.PENDING;
    const updatedReview = await tx.humanReview.update({
      where: { id: review.id },
      data: {
        assignedToUserId: input.assigneeUserId,
        action: input.action as HumanReviewAction,
        status: reviewStatus,
        decision: input.action,
        reason: input.reason,
        modifiedProposal: input.modifiedProposal ? json(input.modifiedProposal) : undefined,
        reviewedAt: input.action === 'MODIFY' || input.action === 'ASSIGN' ? null : new Date(),
      },
    });
    if (nextStatus)
      await tx.recoveryAction.update({
        where: { id: recoveryAction.id },
        data: {
          status: nextStatus,
          userId: input.reviewerUserId,
          reason: input.reason,
          metadata: input.modifiedProposal
            ? json({ modifiedProposal: input.modifiedProposal })
            : undefined,
        },
      });
    const result =
      input.action === 'APPROVE'
        ? 'APPROVED_FOR_DETERMINISTIC_EXECUTION'
        : input.action === 'REJECT'
          ? 'REJECTED'
          : input.action === 'MODIFY'
            ? 'MODIFICATION_REQUIRES_REEVALUATION'
            : input.action === 'ASSIGN'
              ? 'ASSIGNED'
              : 'ESCALATED';
    await tx.explainabilityLedger.create({
      data: {
        merchantId: input.merchantId,
        actionId: recoveryAction.id,
        reviewId: review.id,
        transactionId: recoveryAction.opportunity.transactionId,
        customerId: recoveryAction.opportunity.customerId,
        agent: 'recovery',
        decision: input.action,
        evidence: json({ recommendation: 'stored-on-opportunity' }),
        confidence: 0,
        risk: json({ score: recoveryAction.opportunity.riskScore?.toFixed(2) ?? '0.00' }),
        policy: json({ source: 'review-workflow' }),
        approval: json({ reviewerUserId: input.reviewerUserId, status: reviewStatus }),
        result,
        revenueRescued:
          input.action === 'APPROVE' ? (recoveryAction.executedAmount ?? '0.00') : '0.00',
      },
    });
    await tx.auditLog.create({
      data: {
        merchantId: input.merchantId,
        userId: input.reviewerUserId,
        resourceType: 'HUMAN_REVIEW',
        resourceId: review.id,
        action:
          input.action === 'APPROVE'
            ? AuditAction.APPROVE
            : input.action === 'REJECT'
              ? AuditAction.REJECT
              : input.action === 'ESCALATE'
                ? AuditAction.REVIEW
                : AuditAction.UPDATE,
        newValues: json({ action: input.action, result }),
      },
    });
    return {
      review: updatedReview,
      actionStatus: nextStatus,
      result,
      explainabilityLedger: 'APPENDED' as const,
    };
  });
}
