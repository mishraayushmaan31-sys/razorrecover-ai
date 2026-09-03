import { NextRequest, NextResponse } from 'next/server';
import { requireVerifiedWebhook } from '@/razorpay';
import { failure, success } from '@/lib/api-response';
import { requestId } from '@/lib/request-id';
import { prisma } from '@/database/client';
import { processWebhookEvent } from '@/webhooks/processor';

export async function POST(request: NextRequest) {
  const id = requestId();
  const rawBody = await request.text();
  try {
    requireVerifiedWebhook(rawBody, request.headers.get('x-razorpay-signature') ?? '');
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const eventType =
      request.headers.get('x-razorpay-event') ?? (payload.event as string | undefined);
    const merchantId = request.headers.get('x-merchant-id');
    const eventId = request.headers.get('x-razorpay-event-id');
    if (!merchantId || !eventId || !eventType) {
      return NextResponse.json(
        failure('WEBHOOK_HEADERS_REQUIRED', 'Webhook identity headers are required', id),
        { status: 400 },
      );
    }
    const result = await processWebhookEvent(prisma, {
      merchantId,
      source: 'razorpay',
      eventId,
      eventType,
      signatureValid: true,
      payload,
    });
    return NextResponse.json(
      success({ accepted: true, mode: 'RAZORPAY TEST MODE', ...result }, id),
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      failure('INVALID_WEBHOOK_SIGNATURE', 'Webhook signature verification failed', id),
      { status: 401 },
    );
  }
}
