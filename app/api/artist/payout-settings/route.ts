import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('payout_method, payout_upi_id, payout_account_holder, payout_account_number, payout_ifsc, payout_bank_name')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ configured: false });
    }

    const hasConfig = Boolean(
      (profile.payout_method === 'upi' && profile.payout_upi_id) ||
      (profile.payout_method === 'bank' && profile.payout_account_number)
    );

    let accountNumberMasked: string | null = null;
    if (profile.payout_account_number) {
      const acc = String(profile.payout_account_number);
      accountNumberMasked = acc.length > 4 ? `•••• •••• ${acc.slice(-4)}` : acc;
    }

    return NextResponse.json({
      configured: hasConfig,
      method: profile.payout_method || 'upi',
      upiId: profile.payout_upi_id || '',
      accountHolder: profile.payout_account_holder || '',
      bankName: profile.payout_bank_name || '',
      ifsc: profile.payout_ifsc || '',
      accountNumberMasked,
    });
  } catch (err) {
    console.error('Fetch payout settings error:', err);
    return fail('Internal server error.', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const body = await req.json().catch(() => ({}));
    const { method, upiId, accountHolder, accountNumber, ifsc, bankName } = body;

    if (!['upi', 'bank'].includes(method)) {
      return fail('Please select either UPI or Bank Transfer as your payout method.', 400);
    }

    if (!accountHolder || !accountHolder.trim()) {
      return fail('Account holder name is required.', 400);
    }

    const updates: Record<string, any> = {
      payout_method: method,
      payout_account_holder: accountHolder.trim(),
    };

    if (method === 'upi') {
      const cleanUpi = String(upiId || '').trim();
      const upiRegex = /^[\w.-]+@[\w.-]+$/;
      if (!cleanUpi || !upiRegex.test(cleanUpi)) {
        return fail('Please enter a valid UPI ID (e.g. artist@okaxis, yourname@upi).', 400);
      }
      updates.payout_upi_id = cleanUpi;
      // Clear bank specific if switching to upi
      updates.payout_account_number = null;
      updates.payout_ifsc = null;
      updates.payout_bank_name = null;
    } else {
      const cleanAcc = String(accountNumber || '').replace(/\s+/g, '');
      const cleanIfsc = String(ifsc || '').trim().toUpperCase();
      const cleanBank = String(bankName || '').trim();

      if (!/^\d{9,18}$/.test(cleanAcc)) {
        return fail('Account number must be between 9 and 18 digits.', 400);
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        return fail('Please enter a valid 11-character Indian IFSC code (e.g. HDFC0001234).', 400);
      }
      if (!cleanBank) {
        return fail('Bank name is required.', 400);
      }

      updates.payout_account_number = cleanAcc;
      updates.payout_ifsc = cleanIfsc;
      updates.payout_bank_name = cleanBank;
      updates.payout_upi_id = null;
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      console.error('Update payout settings error:', updateError);
      return fail('Could not save payout details.', 500);
    }

    return NextResponse.json({
      success: true,
      message: 'Payout destination configured successfully.',
    });
  } catch (err) {
    console.error('Save payout settings error:', err);
    return fail('Internal server error.', 500);
  }
}
