import { NextRequest } from 'next/server';
import { z } from 'zod';
import { applyReviewAction } from '@/human-review';
import { PERMISSIONS } from '@/auth/permissions';
import { prisma } from '@/database/client';
import {
  jsonBody,
  protect,
  responseFailure,
  responseSuccess,
  safeError,
} from '@/server/api-helpers';

const schema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'MODIFY', 'ASSIGN', 'ESCALATE']),
  reason: z.string().trim().max(1000).optional(),
  modifiedProposal: z.record(z.unknown()).optional(),
  assigneeUserId: z.string().uuid().optional(),
});

type Context = { params: Promise<{ reviewId: string }> };

export async function POST(request: NextRequest, context: Context) {
  const guard = await protect(request, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.response) return guard.response;
  const parsed = schema.safeParse(await jsonBody(request));
  if (!parsed.success)
    return responseFailure('VALIDATION_ERROR', 'Invalid review action', guard.id, 400);
  const reviewId = (await context.params).reviewId;
  try {
    const result = await applyReviewAction(prisma, {
      merchantId: guard.session.merchantId,
      reviewerUserId: guard.session.userId,
      reviewerRole: guard.session.role,
      reviewId,
      ...parsed.data,
    });
    return responseSuccess(result, guard.id);
  } catch (error) {
    if (error instanceof Error && error.message === 'REVIEW_FORBIDDEN')
      return responseFailure('FORBIDDEN', 'Role cannot perform this review action', guard.id, 403);
    if (error instanceof Error && error.message === 'REVIEW_NOT_FOUND')
      return responseFailure(
        'REVIEW_NOT_FOUND',
        'Review is not pending or belongs to another merchant',
        guard.id,
        404,
      );
    if (error instanceof Error && error.message === 'ASSIGNEE_NOT_FOUND')
      return responseFailure(
        'ASSIGNEE_NOT_FOUND',
        'Assignee is not in this merchant tenant',
        guard.id,
        400,
      );
    return safeError(error, guard.id);
  }
}
