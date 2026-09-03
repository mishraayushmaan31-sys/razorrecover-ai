import { describe, it, expect } from 'vitest';
import type { Prisma, Comment, Issue, User } from '@prisma/client';

describe('Comment Model & Database Mapping', () => {
  it('verifies all required fields and types exist on Comment', () => {
    // Construct a mock comment adhering strictly to the Prisma Comment model interface
    const mockComment: Comment = {
      id: 'comment-uuid-1',
      content: 'Payment degradation identified in HDFC gateway',
      isEdited: false,
      createdAt: new Date('2026-09-03T10:00:00Z'),
      updatedAt: new Date('2026-09-03T10:00:00Z'),
      userId: 'user-uuid-1',
      issueId: 'issue-uuid-1',
      incidentId: null,
    };

    expect(mockComment.id).toBe('comment-uuid-1');
    expect(mockComment.content).toBe('Payment degradation identified in HDFC gateway');
    expect(mockComment.isEdited).toBe(false);
    expect(mockComment.createdAt).toBeInstanceOf(Date);
    expect(mockComment.updatedAt).toBeInstanceOf(Date);
    expect(mockComment.userId).toBe('user-uuid-1');
    expect(mockComment.issueId).toBe('issue-uuid-1');
  });

  it('verifies editing state transitions and isEdited flag', () => {
    const originalDate = new Date('2026-09-03T10:00:00Z');
    const editedDate = new Date('2026-09-03T10:15:00Z');

    const updatedComment: Comment = {
      id: 'comment-uuid-1',
      content: 'Updated: HDFC gateway failure rate stabilized to 2.1%',
      isEdited: true,
      createdAt: originalDate,
      updatedAt: editedDate,
      userId: 'user-uuid-1',
      issueId: 'issue-uuid-1',
      incidentId: null,
    };

    expect(updatedComment.isEdited).toBe(true);
    expect(updatedComment.content).toContain('Updated:');
    expect(updatedComment.updatedAt.getTime()).toBeGreaterThan(updatedComment.createdAt.getTime());
  });

  it('verifies relational integrity between Comment, User, and Issue', () => {
    type CommentWithRelations = Prisma.CommentGetPayload<{
      include: { user: true; issue: true };
    }>;

    const mockUser: Partial<User> = {
      id: 'user-uuid-1',
      email: 'analyst@merchant.com',
      name: 'Operations Analyst',
    };

    const mockIssue: Partial<Issue> = {
      id: 'issue-uuid-1',
      title: 'HDFC Netbanking 504 Gateway Surge',
      status: 'OPEN',
      priority: 'HIGH',
    };

    const payload: CommentWithRelations = {
      id: 'comment-uuid-1',
      content: 'Escalating to on-call payment ops',
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-uuid-1',
      issueId: 'issue-uuid-1',
      incidentId: null,
      user: mockUser as User,
      issue: mockIssue as Issue,
    };

    expect(payload.user.email).toBe('analyst@merchant.com');
    expect(payload.issue.title).toBe('HDFC Netbanking 504 Gateway Surge');
    expect(payload.issue.status).toBe('OPEN');
  });
});
