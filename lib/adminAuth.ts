import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export type AdminUser = {
  id: string;
  email: string;
  role: 'admin';
  name?: string;
};

/**
 * Checks if the caller has 'admin' role in the database.
 * If authorized, returns the user object.
 * If not, returns a 401 or 403 NextResponse error.
 */
export async function requireAdmin(
  req: NextRequest | Request
): Promise<{ user: AdminUser; errorResponse?: never } | { user?: never; errorResponse: NextResponse }> {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return {
        errorResponse: NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 }),
      };
    }

    // Check user role directly in the users table
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, name')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('requireAdmin db error:', error);
      return {
        errorResponse: NextResponse.json({ error: 'Failed to verify admin status.' }, { status: 500 }),
      };
    }

    const adminEmails = [
      'bhosalegurudatta@gmail.com',
      process.env.ADMIN_EMAIL,
    ].filter(Boolean).map((e) => e?.toLowerCase());

    const isDesignatedAdmin = Boolean(
      (user.email && adminEmails.includes(user.email.toLowerCase())) ||
      (profile?.email && adminEmails.includes(profile.email.toLowerCase()))
    );

    if (!profile && !isDesignatedAdmin) {
      return {
        errorResponse: NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 }),
      };
    }

    if (profile?.role !== 'admin' && !isDesignatedAdmin) {
      return {
        errorResponse: NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 }),
      };
    }

    return {
      user: {
        id: profile?.id || user.id,
        email: profile?.email || user.email || '',
        role: 'admin',
        name: profile?.name || 'Administrator',
      },
    };
  } catch (err: any) {
    console.error('requireAdmin error:', err);
    return {
      errorResponse: NextResponse.json({ error: 'Internal server authorization error.' }, { status: 500 }),
    };
  }
}
