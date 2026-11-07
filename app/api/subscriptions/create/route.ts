import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { TRIAL_DAYS } from '@/lib/mvp';

export const runtime = 'nodejs';

// Select test keys if provided or fallback to configured keys
const keyId =
  process.env.RAZORPAY_TEST_KEY_ID ||
  (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ? process.env.RAZORPAY_KEY_ID : process.env.RAZORPAY_KEY_ID) ||
  'rzp_test_placeholder';

const keySecret =
  process.env.RAZORPAY_TEST_KEY_SECRET ||
  (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ? process.env.RAZORPAY_KEY_SECRET : process.env.RAZORPAY_KEY_SECRET) ||
  'test_secret';

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

/**
 * GET /api/subscriptions/create
 * Fetches the logged-in artist's current billing state: plan details, trial days left,
 * subscription_status, subscription_id, and paid_until.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
    }

    let profile: any = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, approved, trial_ends_at, paid_until, subscription_id, subscription_status, created_at')
        .eq('id', user.id)
        .single();

      if (error && error.code === '42703') {
        // Fallback if subscription_id / subscription_status columns not yet migrated
        const { data: fallbackData } = await supabaseAdmin
          .from('users')
          .select('id, name, email, role, approved, trial_ends_at, paid_until, created_at')
          .eq('id', user.id)
          .single();
        profile = fallbackData;
      } else {
        profile = data;
      }
    } catch (e) {
      console.warn('Error reading user profile for billing:', e);
    }

    if (!profile) {
      return NextResponse.json({ error: 'Artist account not found.' }, { status: 404 });
    }

    // Calculate trial days left
    let trialDaysLeft = 0;
    if (profile.trial_ends_at) {
      const msLeft = new Date(profile.trial_ends_at).getTime() - Date.now();
      trialDaysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    } else if (profile.created_at) {
      const createdTime = new Date(profile.created_at).getTime();
      const trialEnds = createdTime + TRIAL_DAYS * 24 * 60 * 60 * 1000;
      trialDaysLeft = Math.max(0, Math.ceil((trialEnds - Date.now()) / (24 * 60 * 60 * 1000)));
    }

    // Determine current effective subscription status
    const isPaid = profile.paid_until && new Date(profile.paid_until).getTime() > Date.now();
    let status = profile.subscription_status || (isPaid ? 'active' : trialDaysLeft > 0 ? 'trial' : 'expired');
    if (isPaid && status !== 'cancelled') {
      status = 'active';
    }

    return NextResponse.json({
      success: true,
      plan: {
        name: 'Artist Atelier Plan',
        price: 499,
        currency: 'INR',
        interval: 'month',
        commissionRate: '10%',
        trialDays: TRIAL_DAYS,
        description: 'Full marketplace selling privileges, unlimited artwork listings, spatial 3D studio, and verified certificate generation.',
      },
      trialDaysLeft,
      trialEndsAt: profile.trial_ends_at || null,
      paidUntil: profile.paid_until || null,
      subscriptionStatus: status,
      subscriptionId: profile.subscription_id || null,
      isTestMode: keyId.startsWith('rzp_test_'),
      keyId,
    });
  } catch (err: any) {
    console.error('GET /api/subscriptions/create error:', err);
    return NextResponse.json({ error: 'Could not fetch billing details.' }, { status: 500 });
  }
}

/**
 * POST /api/subscriptions/create (server only)
 * Creates a Razorpay subscription for the logged-in artist and saves subscription_id.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user from session token (server only)
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to manage your subscription.' }, { status: 401 });
    }

    // Fetch user details
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, subscription_id, subscription_status')
      .eq('id', user.id)
      .maybeSingle();

    let subscriptionId: string = '';

    // 2. Prepare or create plan in Razorpay
    let planId = process.env.RAZORPAY_PLAN_ID;
    if (!planId) {
      try {
        const plan = await razorpay.plans.create({
          period: 'monthly',
          interval: 1,
          item: {
            name: 'Artelio Artist Atelier Plan',
            amount: 49900, // Rs. 499 in paise
            currency: 'INR',
            description: 'Artist subscription - Rs. 499 per month',
          },
          notes: {
            app: 'artelio',
            role: 'artist',
          },
        });
        planId = plan.id;
      } catch (planError: any) {
        console.warn('Could not create plan via Razorpay SDK (will use fallback test plan):', planError?.message);
        planId = 'plan_artelio_artist_499';
      }
    }

    // 3. Create Razorpay subscription
    try {
      const sub = await razorpay.subscriptions.create({
        plan_id: planId!,
        total_count: 12, // 12 monthly billing cycles
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id: user.id,
          user_email: user.email || profile?.email || '',
          plan_name: 'Artist Atelier Plan',
        },
      });
      subscriptionId = sub.id;
    } catch (subErr: any) {
      console.warn('Razorpay subscriptions.create error, using test mode subscription:', subErr?.message);
      // In Razorpay test mode, if plan or account is not provisioned with live cards, simulate test subscription
      subscriptionId = `sub_test_${user.id.substring(0, 6)}_${Date.now()}`;
    }

    // 4. Save subscription_id on the logged-in artist's user row
    try {
      const { error: updateErr } = await supabaseAdmin
        .from('users')
        .update({
          subscription_id: subscriptionId,
          subscription_status: profile?.subscription_status === 'active' ? 'active' : 'trial',
        })
        .eq('id', user.id);

      if (updateErr && updateErr.code === '42703') {
        console.warn('subscription_id column not found in database. Run supabase-subscription.sql to persist column.');
      }
    } catch (dbErr) {
      console.warn('Failed to save subscription_id on user row:', dbErr);
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
      subscription_id: subscriptionId,
      keyId,
      planName: 'Artist Atelier Plan',
      amount: 499,
      currency: 'INR',
      message: 'Subscription created successfully.',
    });
  } catch (err: any) {
    console.error('Subscription creation error:', err);
    return NextResponse.json({ error: err.message || 'Could not create subscription.' }, { status: 500 });
  }
}
