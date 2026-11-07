import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * POST /api/test/razorpay-webhook
 * Helper for Razorpay Test Mode: signs the payload with RAZORPAY_WEBHOOK_SECRET
 * and delivers it directly to /api/webhooks/razorpay with the valid X-Razorpay-Signature.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_artelio_test_secret_2026';
    const body = await req.json();
    const rawBody = JSON.stringify(body);

    const signature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const webhookRes = await fetch(`${siteUrl}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
      },
      body: rawBody,
    });

    const resJson = await webhookRes.json().catch(() => ({}));
    return NextResponse.json({
      status: webhookRes.status,
      result: resJson,
    });
  } catch (err: any) {
    console.error('Test webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
