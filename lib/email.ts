import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

/**
 * Core email dispatcher using Resend.
 * Reads RESEND_API_KEY and EMAIL_FROM from the environment.
 * If missing, logs the email instead of failing.
 * Never throws an unhandled error.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{
  success: boolean;
  logged?: boolean;
  error?: any;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL;
  const recipients = Array.isArray(to) ? to : [to];

  // Strip empty/undefined recipients
  const validRecipients = recipients.filter((r) => typeof r === 'string' && r.trim().length > 0);
  if (validRecipients.length === 0) {
    console.warn('[Artelio Email] No valid recipient email address provided. Skipped.');
    return { success: false, error: 'No recipients provided' };
  }

  // If configuration is missing, log email details instead of failing
  if (!apiKey || !fromEmail) {
    console.log('----------------------------------------------------');
    console.log('[Artelio Email] RESEND_API_KEY or EMAIL_FROM missing. Logging email:');
    console.log(`To: ${validRecipients.join(', ')}`);
    console.log(`From: ${fromEmail || '(Not configured)'}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html.replace(/<[^>]+>/g, ' ').slice(0, 300)}...`);
    console.log('----------------------------------------------------');
    return { success: true, logged: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: validRecipients,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' '),
    });

    if (error) {
      console.error('[Artelio Email] Resend API error:', error);
      return { success: false, error };
    }

    console.log(`[Artelio Email] Successfully sent "${subject}" to ${validRecipients.join(', ')} (ID: ${data?.id})`);
    return { success: true };
  } catch (err: any) {
    console.error('[Artelio Email] Failed to send email via Resend:', err?.message || err);
    return { success: false, error: err };
  }
}

/**
 * Helper to fetch admin emails from database or fallback to environment.
 */
export async function getAdminEmails(): Promise<string[]> {
  const envAdmin = process.env.ADMIN_EMAIL;
  try {
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('role', 'admin');
    const emails = (admins || [])
      .map((a) => a.email)
      .filter((e): e is string => Boolean(e && e.includes('@')));
    if (emails.length > 0) {
      return Array.from(new Set([...(envAdmin ? [envAdmin] : []), ...emails]));
    }
  } catch (err) {
    console.error('[Artelio Email] Failed to query admin emails:', err);
  }
  return [envAdmin || 'admin@artelio.in'];
}

/* ==============================================================================
 * 1. TEMPLATE: Application Approved (to artist)
 * ============================================================================== */
export async function sendApplicationApprovedEmail({
  to,
  artistName,
  trialDays = 30,
}: {
  to: string;
  artistName?: string | null;
  trialDays?: number;
}) {
  const name = artistName || 'Artist';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artelio.in';

  const subject = 'Welcome to Artelio Atelier — Your Artist Application is Approved!';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F141F; color: #FFFFFF; padding: 36px 28px; border-radius: 16px;">
      <h1 style="color: #F83758; font-size: 26px; margin: 0 0 10px; font-weight: 800; letter-spacing: -0.5px;">ARTELIO ATELIER</h1>
      <p style="font-size: 13px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 24px;">Artist Verification & Onboarding</p>
      
      <div style="border-top: 1px solid #1E293B; padding-top: 24px;">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Dear ${name},</p>
        <p style="font-size: 15px; color: #E2E8F0; line-height: 1.6; margin-bottom: 20px;">
          Congratulations! Your portfolio has been reviewed and approved by the Artelio Curation Council. Your creator studio is now officially active.
        </p>

        <div style="background: #182234; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px; color: #38BDF8; font-size: 15px;">✨ What&rsquo;s Next:</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #CBD5E1; line-height: 1.7;">
            <li><strong>${trialDays}-Day Free Listing Trial:</strong> List unlimited original physical and digital pieces with zero listing fees.</li>
            <li><strong>Curated Collector Reach:</strong> Showcase your artworks to verified collectors across India.</li>
            <li><strong>Escrow Protected Sales:</strong> Secure payouts directly to your registered bank account or UPI ID.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${siteUrl}/dashboard/upload" style="background: linear-gradient(135deg, #F83758, #E02244); color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 9999px; display: inline-block;">
            Upload Your First Artwork &rarr;
          </a>
        </div>

        <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
          Need assistance or custom packaging guidelines? Our curator team is available on WhatsApp concierge support.
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #1E293B; margin: 28px 0 16px;" />
      <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
        Artelio Fine Art Marketplace • Curated Indian Originals
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/* ==============================================================================
 * 2. TEMPLATE: New Order (to artist)
 * ============================================================================== */
export async function sendNewOrderArtistEmail({
  to,
  artistName,
  orderId,
  artworkTitle,
  amount,
  buyerName,
  shippingAddress,
  isDigital,
}: {
  to: string;
  artistName?: string | null;
  orderId: string;
  artworkTitle: string;
  amount: number;
  buyerName: string;
  shippingAddress?: string | null;
  isDigital?: boolean;
}) {
  const name = artistName || 'Artist';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artelio.in';
  const formattedPrice = `₹${Number(amount).toLocaleString('en-IN')}`;

  const subject = `Artwork Sold: "${artworkTitle}" (Order #${orderId.slice(0, 8).toUpperCase()})`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F141F; color: #FFFFFF; padding: 36px 28px; border-radius: 16px;">
      <h1 style="color: #F83758; font-size: 26px; margin: 0 0 10px; font-weight: 800;">ARTELIO ATELIER</h1>
      <p style="font-size: 13px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 24px;">New Order Notification</p>
      
      <div style="border-top: 1px solid #1E293B; padding-top: 24px;">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Congratulations, ${name}!</p>
        <p style="font-size: 15px; color: #E2E8F0; line-height: 1.6; margin-bottom: 20px;">
          Collector <strong>${buyerName}</strong> has just purchased your artwork <strong>"${artworkTitle}"</strong> for <strong>${formattedPrice}</strong>.
          Payment has been verified and your earnings are safely secured in Artelio Escrow.
        </p>

        <div style="background: #182234; border: 1px solid #F59E0B; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; color: #F59E0B; font-size: 15px;">
            ${isDigital ? '⚡ Digital Delivery' : '📦 Action Required: Pack & Ship Artwork'}
          </h3>
          <p style="margin: 4px 0; font-size: 14px; color: #CBD5E1;">
            Order ID: <span style="font-family: monospace; color: #FFFFFF;">#${orderId.slice(0, 8).toUpperCase()}</span>
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #CBD5E1;">
            Artwork: <strong style="color: #FFFFFF;">${artworkTitle}</strong>
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #CBD5E1;">
            Order Total: <strong style="color: #38BDF8;">${formattedPrice}</strong>
          </p>
          ${
            !isDigital && shippingAddress
              ? `<div style="margin-top: 12px; border-top: 1px solid #334155; padding-top: 12px;">
                  <p style="margin: 0 0 4px; font-size: 12px; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Shipping Address:</p>
                  <p style="margin: 0; font-size: 13px; color: #FFFFFF; line-height: 1.5;">${shippingAddress}</p>
                </div>`
              : ''
          }
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${siteUrl}/dashboard" style="background: linear-gradient(135deg, #F83758, #E02244); color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 9999px; display: inline-block;">
            Open Artist Dashboard &rarr;
          </a>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #1E293B; margin: 28px 0 16px;" />
      <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
        Artelio Escrow Protection • Secure Artist Payouts
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/* ==============================================================================
 * 3. TEMPLATE: Piece Shipped (to buyer)
 * ============================================================================== */
export async function sendPieceShippedBuyerEmail({
  to,
  buyerName,
  orderId,
  artworkTitle,
  courierName,
  trackingNumber,
  trackingUrl,
}: {
  to: string;
  buyerName?: string | null;
  orderId: string;
  artworkTitle: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}) {
  const name = buyerName || 'Collector';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artelio.in';

  const subject = `Your Artelio Order Has Shipped: "${artworkTitle}"`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F141F; color: #FFFFFF; padding: 36px 28px; border-radius: 16px;">
      <h1 style="color: #F83758; font-size: 26px; margin: 0 0 10px; font-weight: 800;">ARTELIO ATELIER</h1>
      <p style="font-size: 13px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 24px;">White-Glove Courier Dispatch</p>
      
      <div style="border-top: 1px solid #1E293B; padding-top: 24px;">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Dear ${name},</p>
        <p style="font-size: 15px; color: #E2E8F0; line-height: 1.6; margin-bottom: 20px;">
          Great news! The artist has dispatched your curated piece <strong>"${artworkTitle}"</strong>. It is now safely in transit with insured courier delivery.
        </p>

        <div style="background: #182234; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; color: #38BDF8; font-size: 15px;">🚚 Shipment Details:</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #CBD5E1;">
            Order ID: <span style="font-family: monospace; color: #FFFFFF;">#${orderId.slice(0, 8).toUpperCase()}</span>
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #CBD5E1;">
            Courier: <strong style="color: #FFFFFF;">${courierName || 'Insured Fine Art Logistics'}</strong>
          </p>
          ${
            trackingNumber
              ? `<p style="margin: 4px 0; font-size: 14px; color: #CBD5E1;">
                  Tracking / AWB Number: <strong style="font-family: monospace; color: #F59E0B;">${trackingNumber}</strong>
                </p>`
              : ''
          }
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${trackingUrl || `${siteUrl}/track`}" style="background: linear-gradient(135deg, #38BDF8, #0284C7); color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 9999px; display: inline-block;">
            ${trackingUrl ? 'Track Parcel in Real-Time &rarr;' : 'Open Artelio Tracking &rarr;'}
          </a>
        </div>

        <p style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
          Once the parcel arrives, please inspect the packaging and confirm delivery in your account orders portal.
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #1E293B; margin: 28px 0 16px;" />
      <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
        Artelio Insured Courier Logistics • 48-Hour Guarantee
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/* ==============================================================================
 * 4. TEMPLATE: Payout Released (to artist)
 * ============================================================================== */
export async function sendPayoutReleasedArtistEmail({
  to,
  artistName,
  orderId,
  artworkTitle,
  amount,
}: {
  to: string;
  artistName?: string | null;
  orderId: string;
  artworkTitle?: string | null;
  amount: number;
}) {
  const name = artistName || 'Artist';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artelio.in';
  const formattedPayout = `₹${Number(amount).toLocaleString('en-IN')}`;

  const subject = `Payout Released: ${formattedPayout} for Order #${orderId.slice(0, 8).toUpperCase()}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F141F; color: #FFFFFF; padding: 36px 28px; border-radius: 16px;">
      <h1 style="color: #F83758; font-size: 26px; margin: 0 0 10px; font-weight: 800;">ARTELIO ATELIER</h1>
      <p style="font-size: 13px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 24px;">Escrow Settlement Notice</p>
      
      <div style="border-top: 1px solid #1E293B; padding-top: 24px;">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Dear ${name},</p>
        <p style="font-size: 15px; color: #E2E8F0; line-height: 1.6; margin-bottom: 20px;">
          Good news! Delivery has been confirmed for your artwork ${artworkTitle ? `<strong>"${artworkTitle}"</strong>` : `(Order #${orderId.slice(0, 8).toUpperCase()})`}.
          Your escrow payment of <strong>${formattedPayout}</strong> has been released to your registered payout account.
        </p>

        <div style="background: #182234; border: 1px solid #10B981; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; color: #10B981; font-size: 15px;">💰 Settlement Summary:</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #CBD5E1;">
            Order ID: <span style="font-family: monospace; color: #FFFFFF;">#${orderId.slice(0, 8).toUpperCase()}</span>
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #CBD5E1;">
            Released Amount: <strong style="color: #10B981; font-size: 16px;">${formattedPayout}</strong>
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #CBD5E1;">
            Status: <span style="color: #38BDF8; font-weight: 700;">Released (Processed)</span>
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${siteUrl}/dashboard" style="background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 9999px; display: inline-block;">
            View Settlement in Dashboard &rarr;
          </a>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #1E293B; margin: 28px 0 16px;" />
      <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
        Artelio Escrow System • Fast & Transparent Artist Payouts
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/* ==============================================================================
 * 5. TEMPLATE: Problem Reported (to buyer and admin)
 * ============================================================================== */
export async function sendProblemReportedEmails({
  buyerEmail,
  buyerName,
  orderId,
  artworkTitle,
  reason,
  adminEmails,
}: {
  buyerEmail: string;
  buyerName?: string | null;
  orderId: string;
  artworkTitle?: string | null;
  reason: string;
  adminEmails?: string[];
}) {
  const name = buyerName || 'Collector';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artelio.in';

  // 1. Email to Buyer
  const buyerSubject = `Dispute Received: Order #${orderId.slice(0, 8).toUpperCase()} (Escrow Frozen)`;
  const buyerHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F141F; color: #FFFFFF; padding: 36px 28px; border-radius: 16px;">
      <h1 style="color: #F83758; font-size: 26px; margin: 0 0 10px; font-weight: 800;">ARTELIO SUPPORT</h1>
      <p style="font-size: 13px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 24px;">Escrow Protection & Dispute Ticket</p>
      
      <div style="border-top: 1px solid #1E293B; padding-top: 24px;">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Dear ${name},</p>
        <p style="font-size: 15px; color: #E2E8F0; line-height: 1.6; margin-bottom: 20px;">
          We have received your report regarding order #${orderId.slice(0, 8).toUpperCase()}${artworkTitle ? ` for "${artworkTitle}"` : ''}.
          <strong>Your funds are protected:</strong> automatic escrow payout to the artist has been immediately frozen while our team investigates.
        </p>

        <div style="background: #182234; border: 1px solid #EF4444; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px; color: #EF4444; font-size: 15px;">Reported Issue:</h3>
          <p style="margin: 0; font-size: 14px; color: #FCA5A5; font-style: italic;">&ldquo;${reason}&rdquo;</p>
        </div>

        <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6;">
          Our resolution desk will contact both you and the artist within 24 hours. If the artwork arrived damaged or inconsistent with description, you are fully covered under Artelio Buyer Protection.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${siteUrl}/orders" style="background: #334155; color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 9999px; display: inline-block;">
            View Order Status &rarr;
          </a>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #1E293B; margin: 28px 0 16px;" />
      <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
        Artelio Buyer Protection Guarantee
      </p>
    </div>
  `;

  const buyerPromise = sendEmail({ to: buyerEmail, subject: buyerSubject, html: buyerHtml });

  // 2. Email to Admin
  const targetAdmins = adminEmails && adminEmails.length > 0 ? adminEmails : await getAdminEmails();
  const adminSubject = `🚨 [URGENT] Order Dispute Raised: #${orderId.slice(0, 8).toUpperCase()}`;
  const adminHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F141F; color: #FFFFFF; padding: 36px 28px; border-radius: 16px;">
      <h1 style="color: #EF4444; font-size: 24px; margin: 0 0 10px; font-weight: 800;">ARTELIO ADMIN ALERT</h1>
      <p style="font-size: 13px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 24px;">Buyer Dispute Notification</p>
      
      <div style="border-top: 1px solid #1E293B; padding-top: 24px;">
        <p style="font-size: 15px; color: #E2E8F0; line-height: 1.6;">
          A customer has filed a dispute for Order <strong>#${orderId}</strong>. Escrow payout has been frozen.
        </p>

        <div style="background: #182234; border: 1px solid #EF4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="margin: 4px 0; font-size: 13px; color: #CBD5E1;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #CBD5E1;"><strong>Customer:</strong> ${name} (${buyerEmail})</p>
          ${artworkTitle ? `<p style="margin: 4px 0; font-size: 13px; color: #CBD5E1;"><strong>Artwork:</strong> ${artworkTitle}</p>` : ''}
          <p style="margin: 12px 0 4px; font-size: 12px; color: #FCA5A5; text-transform: uppercase; font-weight: 700;">Dispute Reason:</p>
          <p style="margin: 0; font-size: 14px; color: #FFFFFF; background: #0B0E17; padding: 10px; border-radius: 8px;">${reason}</p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${siteUrl}/admin" style="background: #EF4444; color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 9999px; display: inline-block;">
            Open Admin Command Center &rarr;
          </a>
        </div>
      </div>
    </div>
  `;

  const adminPromise = sendEmail({ to: targetAdmins, subject: adminSubject, html: adminHtml });

  const [resBuyer, resAdmin] = await Promise.allSettled([buyerPromise, adminPromise]);
  return { resBuyer, resAdmin };
}

/* ==============================================================================
 * 6. TEMPLATE: New Listing Report (to admin)
 * ============================================================================== */
export async function sendNewListingReportAdminEmail({
  artworkId,
  artworkTitle,
  reporterEmail,
  reason,
  details,
  adminEmails,
}: {
  artworkId: string;
  artworkTitle?: string | null;
  reporterEmail?: string | null;
  reason: string;
  details?: string | null;
  adminEmails?: string[];
}) {
  const targetAdmins = adminEmails && adminEmails.length > 0 ? adminEmails : await getAdminEmails();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artelio.in';

  const subject = `🚨 [Listing Report] "${artworkTitle || artworkId.slice(0, 8)}" reported for ${reason}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F141F; color: #FFFFFF; padding: 36px 28px; border-radius: 16px;">
      <h1 style="color: #F59E0B; font-size: 24px; margin: 0 0 10px; font-weight: 800;">ARTELIO MODERATION ALERT</h1>
      <p style="font-size: 13px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 24px;">New Listing Report Submitted</p>
      
      <div style="border-top: 1px solid #1E293B; padding-top: 24px;">
        <p style="font-size: 15px; color: #E2E8F0; line-height: 1.6;">
          A user has submitted a moderation report on an artwork listing.
        </p>

        <div style="background: #182234; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="margin: 4px 0; font-size: 13px; color: #CBD5E1;"><strong>Artwork ID:</strong> ${artworkId}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #CBD5E1;"><strong>Artwork Title:</strong> ${artworkTitle || 'N/A'}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #CBD5E1;"><strong>Reporter:</strong> ${reporterEmail || 'Registered Member'}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #CBD5E1;"><strong>Reason:</strong> <span style="color: #F87171; font-weight: 700;">${reason}</span></p>
          ${
            details
              ? `<div style="margin-top: 12px; border-top: 1px solid #334155; padding-top: 10px;">
                  <p style="margin: 0 0 4px; font-size: 12px; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Additional Details:</p>
                  <p style="margin: 0; font-size: 13px; color: #FFFFFF; background: #0B0E17; padding: 10px; border-radius: 8px;">${details}</p>
                </div>`
              : ''
          }
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${siteUrl}/admin/reports" style="background: linear-gradient(135deg, #F83758, #E02244); color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 9999px; display: inline-block;">
            Review in Admin Reports &rarr;
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: targetAdmins, subject, html });
}

/* ==============================================================================
 * 7. TEMPLATE: New Message Notification (between buyer & artist)
 * ============================================================================== */
export async function sendMessageNotificationEmail({
  to,
  recipientName,
  senderName,
  artworkTitle,
  messagePreview,
  conversationId,
}: {
  to: string;
  recipientName?: string | null;
  senderName?: string | null;
  artworkTitle?: string | null;
  messagePreview: string;
  conversationId: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const displaySender = senderName || 'A member';
  const displayTitle = artworkTitle || 'an artwork';
  const subject = `New message from ${displaySender} regarding "${displayTitle}" on Artelio`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; color: #17223B; padding: 32px 24px; border: 1px solid #E8E8E8; border-radius: 16px;">
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <span style="font-size: 20px; font-weight: 900; color: #4392F9; letter-spacing: -0.5px;">Art<span style="color: #F83758;">elio</span></span>
        <span style="margin-left: 8px; font-size: 11px; font-weight: 700; color: #626262; background: #F3F3F3; padding: 2px 8px; border-radius: 9999px;">Studio Messaging</span>
      </div>

      <h1 style="color: #17223B; font-size: 20px; font-weight: 800; margin: 0 0 12px;">New Message Received</h1>
      <p style="font-size: 14px; color: #626262; line-height: 1.6; margin: 0 0 20px;">
        Hello ${recipientName || 'there'}, <strong>${displaySender}</strong> sent you a message regarding <strong>${displayTitle}</strong>:
      </p>

      <div style="background: #FAFAFA; border-left: 4px solid #F83758; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
        <p style="font-size: 14px; color: #17223B; line-height: 1.6; margin: 0; white-space: pre-wrap;">"${messagePreview}"</p>
      </div>

      <div style="background: #FDF0F3; border: 1px solid rgba(248, 55, 88, 0.2); border-radius: 10px; padding: 14px 18px; margin: 20px 0;">
        <p style="font-size: 12px; font-weight: 700; color: #F83758; margin: 0 0 4px;">Important Safety Reminder:</p>
        <p style="font-size: 12px; color: #626262; margin: 0; line-height: 1.5;">
          <strong>Keep all conversations on Artelio.</strong> To safeguard buyers and creators under Artelio Escrow and ensure dispute coverage, never exchange off-platform contact details or payments.
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${siteUrl}/messages/${conversationId}" style="background: #F83758; color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 12px; display: inline-block;">
          Reply on Artelio &rarr;
        </a>
      </div>

      <p style="font-size: 11px; color: #A8A8A9; text-align: center; margin: 24px 0 0;">
        Artelio Curated Marketplace • Fine Art Direct from Certified Studios
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `${displaySender}: "${messagePreview}"\n\nReply at: ${siteUrl}/messages/${conversationId}\n\nKeep all conversations on Artelio.`,
  });
}

/**
 * Checks whether outbound email service credentials (Resend) are configured.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && (process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL));
}

/* ==============================================================================
 * 8. TEMPLATE: New Artwork Published (to artist's followers)
 * Sent once per artwork when published by an artist. Skips if email not configured.
 * ============================================================================== */
export async function notifyFollowersNewArtwork({
  artworkId,
  artistId,
  title,
  price,
  imageUrl,
  medium,
}: {
  artworkId: string;
  artistId: string;
  title: string;
  price: number;
  imageUrl?: string | null;
  medium?: string | null;
}): Promise<{
  success: boolean;
  skipped?: boolean;
  reason?: string;
  sentCount?: number;
}> {
  // Requirement 3: Skip sending if email is not configured
  if (!isEmailConfigured()) {
    console.log('[Artelio Email] Outbound email not configured (RESEND_API_KEY/EMAIL_FROM missing). Skipping follower notifications.');
    return { success: true, skipped: true, reason: 'Email not configured' };
  }

  try {
    // Check if artwork was already notified or is still hidden (draft)
    const { data: art, error: artErr } = await supabaseAdmin
      .from('artworks')
      .select('id, followers_notified, is_hidden')
      .eq('id', artworkId)
      .maybeSingle();

    if (artErr) {
      console.warn('[Artelio Email] Notice reading artwork notification status:', artErr.message);
    }

    if (art) {
      if (art.followers_notified) {
        console.log(`[Artelio Email] Artwork ${artworkId} already notified followers. Skipping.`);
        return { success: true, skipped: true, reason: 'Already notified' };
      }
      if (art.is_hidden) {
        console.log(`[Artelio Email] Artwork ${artworkId} is hidden/draft. Skipping follower notification.`);
        return { success: true, skipped: true, reason: 'Artwork is draft/hidden' };
      }
    }

    // Set followers_notified to true immediately to guarantee once-per-artwork dispatch
    await supabaseAdmin
      .from('artworks')
      .update({ followers_notified: true })
      .eq('id', artworkId);

    // Fetch artist profile
    const { data: artist } = await supabaseAdmin
      .from('users')
      .select('id, name, shop_name')
      .eq('id', artistId)
      .single();

    const artistName = artist?.shop_name || artist?.name || 'An artist you follow';

    // Fetch all followers of this artist
    const { data: followRows, error: followErr } = await supabaseAdmin
      .from('follows')
      .select('follower_id')
      .eq('artist_id', artistId);

    if (followErr) {
      console.error('[Artelio Email] Error fetching followers for artist:', followErr);
      return { success: false, reason: followErr.message };
    }

    if (!followRows || followRows.length === 0) {
      console.log(`[Artelio Email] Artist ${artistId} has 0 followers. No emails to send.`);
      return { success: true, sentCount: 0 };
    }

    const followerIds = followRows.map((f: any) => f.follower_id).filter(Boolean);
    const { data: followers, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .in('id', followerIds);

    if (userErr || !followers || followers.length === 0) {
      console.log(`[Artelio Email] No follower email addresses found for artist ${artistId}.`);
      return { success: true, sentCount: 0 };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const artworkUrl = `${siteUrl}/artwork/${artworkId}`;
    const artistUrl = `${siteUrl}/artist/${artistId}`;
    const formattedPrice = `₹${price.toLocaleString('en-IN')}`;
    const subject = `New artwork from ${artistName}: "${title}" on Artelio`;

    let sentCount = 0;

    for (const follower of followers) {
      if (!follower.email || !follower.email.includes('@')) continue;

      const recipientName = follower.name || 'Art Collector';

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; color: #17223B; padding: 32px 24px; border: 1px solid #E8E8E8; border-radius: 16px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <span style="font-size: 20px; font-weight: 900; color: #4392F9; letter-spacing: -0.5px;">Art<span style="color: #F83758;">elio</span></span>
            <span style="margin-left: 8px; font-size: 11px; font-weight: 700; color: #F83758; background: #FDF0F3; padding: 2px 8px; border-radius: 9999px;">New Studio Release</span>
          </div>

          <h1 style="color: #17223B; font-size: 22px; font-weight: 800; margin: 0 0 12px; line-height: 1.3;">
            ${artistName} Just Published a New Artwork
          </h1>

          <p style="font-size: 14px; color: #626262; line-height: 1.6; margin: 0 0 20px;">
            Hello ${recipientName}, good news! <strong>${artistName}</strong>, an artist you follow on Artelio, just published a new piece in their collection:
          </p>

          <div style="background: #FAFAFA; border: 1px solid #E8E8E8; border-radius: 12px; overflow: hidden; margin: 24px 0;">
            ${
              imageUrl
                ? `<div style="text-align: center; background: #0B0E17; max-height: 320px; overflow: hidden;">
                    <img src="${imageUrl}" alt="${title}" style="max-width: 100%; max-height: 320px; object-fit: contain; display: block; margin: 0 auto;" />
                  </div>`
                : ''
            }
            <div style="padding: 20px;">
              <h2 style="font-size: 18px; font-weight: 800; color: #17223B; margin: 0 0 6px;">
                ${title}
              </h2>
              <p style="font-size: 13px; color: #626262; margin: 0 0 12px;">
                ${medium ? `Medium: <strong>${medium}</strong> • ` : ''}Original Artwork
              </p>
              <div style="display: flex; align-items: baseline; gap: 8px;">
                <span style="font-size: 20px; font-weight: 900; color: #17223B;">${formattedPrice}</span>
                <span style="font-size: 11px; font-weight: 700; color: #10B981; background: #ECFDF5; padding: 2px 6px; border-radius: 4px;">Available Now</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${artworkUrl}" style="background: #F83758; color: #FFFFFF; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(248, 55, 88, 0.25);">
              View Artwork on Artelio &rarr;
            </a>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${artistUrl}" style="font-size: 12px; color: #4392F9; text-decoration: none; font-weight: 600;">
              Visit ${artistName}'s Studio Shop &rarr;
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #E8E8E8; margin: 28px 0;" />

          <p style="font-size: 11px; color: #A8A8A9; text-align: center; margin: 0; line-height: 1.5;">
            You received this email because you follow <strong>${artistName}</strong> on Artelio.<br />
            To manage your followed studios, visit your <a href="${siteUrl}/following" style="color: #626262; text-decoration: underline;">Following Feed</a>.
          </p>
        </div>
      `;

      await sendEmail({
        to: follower.email,
        subject,
        html,
        text: `${artistName} just published "${title}" (${formattedPrice}) on Artelio.\n\nView it here: ${artworkUrl}\nVisit shop: ${artistUrl}`,
      });

      sentCount++;
    }

    console.log(`[Artelio Email] Notified ${sentCount} followers of ${artistName} about artwork ${artworkId}.`);
    return { success: true, sentCount };
  } catch (err: any) {
    console.error('[Artelio Email] notifyFollowersNewArtwork error:', err);
    return { success: false, reason: err?.message || 'Unknown error' };
  }
}

