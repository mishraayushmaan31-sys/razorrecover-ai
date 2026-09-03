import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/comments/route';
import { PATCH, DELETE } from '@/app/api/comments/[commentId]/route';
import { createSessionToken } from '@/auth/session';

describe('Comments API Endpoints', () => {
  let validToken: string;

  beforeEach(async () => {
    validToken = await createSessionToken({
      userId: 'test-user-1',
      merchantId: 'test-merchant-1',
      role: 'OPERATIONS_MANAGER',
    });
  });

  it('rejects unauthenticated requests to GET /api/comments with 401', async () => {
    const request = new NextRequest('http://localhost:3000/api/comments');
    const response = await GET(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('allows authenticated users to query comments via GET /api/comments', async () => {
    const request = new NextRequest('http://localhost:3000/api/comments?incidentId=incident-1042', {
      headers: {
        cookie: `rr_session=${validToken}`,
      },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.data.comments)).toBe(true);
  });

  it('rejects invalid comment creation with 400 when content is empty', async () => {
    const request = new NextRequest('http://localhost:3000/api/comments', {
      method: 'POST',
      headers: {
        cookie: `rr_session=${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '', incidentId: 'incident-1042' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates a comment successfully via POST /api/comments with 201', async () => {
    const request = new NextRequest('http://localhost:3000/api/comments', {
      method: 'POST',
      headers: {
        cookie: `rr_session=${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Investigating secondary failover rails for netbanking traffic.',
        incidentId: 'incident-1042',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.comment.content).toContain('Investigating secondary failover');
    expect(json.data.comment.isEdited).toBe(false);
  });

  it('updates an existing comment via PATCH /api/comments/[id] and marks it edited', async () => {
    const request = new NextRequest('http://localhost:3000/api/comments/comment-demo-1', {
      method: 'PATCH',
      headers: {
        cookie: `rr_session=${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Updated: Traffic restored to 94% on secondary routing rail.',
      }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ commentId: 'comment-demo-1' }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.comment.isEdited).toBe(true);
    expect(json.data.comment.content).toContain('Updated: Traffic restored');
  });

  it('deletes a comment via DELETE /api/comments/[id] with 200', async () => {
    const request = new NextRequest('http://localhost:3000/api/comments/comment-demo-1', {
      method: 'DELETE',
      headers: {
        cookie: `rr_session=${validToken}`,
      },
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ commentId: 'comment-demo-1' }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.deleted).toBe(true);
  });
});
