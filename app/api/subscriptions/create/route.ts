import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';

export const runtime = 'nodejs';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to upgrade your plan.' }, { status: 401 });
    }

    const { planId } = await req.json();
    if (!planId || !SUBSCRIPTION_PLANS[planId]) {
      return NextResponse.json({ error: 'Invalid subscription plan selected.' }, { status: 400 });
    }

    const plan = SUBSCRIPTION_PLANS[planId];

    // Create a Razorpay Order for the plan activation
    const order = await razorpay.orders.create({
      amount: Math.round(plan.price * 100), // paise
      currency: 'INR',
      receipt: `sub_${user.id.substring(0, 8)}_${Date.now()}`,
      notes: {
        plan_id: plan.id,
        user_id: user.id,
        target_role: plan.targetRole,
        billing_interval: plan.billingInterval,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      planName: plan.name,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('Subscription order creation error:', err);
    return NextResponse.json({ error: err.message || 'Could not initiate upgrade.' }, { status: 500 });
  }
}
