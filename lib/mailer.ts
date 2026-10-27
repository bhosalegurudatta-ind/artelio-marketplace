/**
 * Transactional Email Dispatcher for Artelio Marketplace
 * Sends responsive HTML emails for:
 * 1. Collector Order Confirmation & Escrow Receipt
 * 2. Artist Sale Alert with Courier Delivery Destination
 * 3. Collector Dispatch Alert with Live Courier Tracking & AWB
 */

type OrderEmailData = {
  orderId: string;
  artworkTitle: string;
  artworkPrice: number;
  isDigital?: boolean;
  buyerName: string;
  buyerEmail?: string | null;
  artistName: string;
  artistEmail?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingPhone?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

export async function sendOrderEmails(data: OrderEmailData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artelio.in';

  console.log('[Artelio Mailer] Preparing transactional notifications for order:', data.orderId);

  // 1. Collector HTML Email
  const buyerSubject = `Acquisition Confirmed: "${data.artworkTitle}" (Order #${data.orderId.slice(0, 8).toUpperCase()})`;
  const buyerHtml = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #0f141f; color: #ffffff; padding: 32px; border-radius: 16px;">
      <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 8px;">ARTELIO ATELIER</h1>
      <p style="font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Fine Art Acquisition Confirmation</p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
      
      <p style="font-size: 16px; line-height: 1.6;">Dear ${data.buyerName},</p>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
        Your acquisition of <strong>"${data.artworkTitle}"</strong> by <strong>${data.artistName}</strong> has been secured.
        Your funds (₹${data.artworkPrice.toLocaleString('en-IN')}) are held in protected escrow until the work arrives safely at your destination.
      </p>

      <div style="background: #182234; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #f8fafc; font-size: 15px;">Order Summary</h3>
        <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">Order ID: <span style="font-family: monospace; color: #ffffff;">#${data.orderId.slice(0, 8).toUpperCase()}</span></p>
        <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">Format: <strong style="color: #ffffff;">${data.isDigital ? 'Digital Archival Masterwork' : 'Original Physical Fine Art'}</strong></p>
        <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">Total Paid: <strong style="color: #f59e0b; font-size: 16px;">₹${data.artworkPrice.toLocaleString('en-IN')}</strong></p>
        ${
          !data.isDigital && data.shippingAddress
            ? `<div style="margin-top: 12px; border-top: 1px dashed #334155; pt-2;">
                <p style="margin: 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Shipping Destination:</p>
                <p style="margin: 2px 0; font-size: 13px; color: #ffffff;">${data.shippingAddress}, ${data.shippingCity}, ${data.shippingState} - ${data.shippingPostalCode}</p>
                <p style="margin: 2px 0; font-size: 12px; color: #94a3b8;">Phone: ${data.shippingPhone || 'On file'}</p>
              </div>`
            : ''
        }
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${siteUrl}/orders" style="background: #d97706; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 9999px; display: inline-block;">
          View Order & Print Certificate of Authenticity (COA)
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center;">
        Artelio Escrow Protection • 48-Hour Transit Guarantee • Insured Museum Logistics
      </p>
    </div>
  `;

  // 2. Artist HTML Email (Dispatch Destination & Payout Information)
  const artistSubject = `Artwork Sold: "${data.artworkTitle}" — Action Required: Ship Parcel`;
  const artistHtml = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #0f141f; color: #ffffff; padding: 32px; border-radius: 16px;">
      <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 8px;">ARTELIO ATELIER</h1>
      <p style="font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Studio Sales Notification</p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
      
      <p style="font-size: 16px; line-height: 1.6;">Congratulations, ${data.artistName}!</p>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
        A collector has acquired your piece <strong>"${data.artworkTitle}"</strong> for <strong>₹${data.artworkPrice.toLocaleString('en-IN')}</strong>.
        Your net earnings (90%) are secured in escrow and will be settled to your registered bank account or UPI ID.
      </p>

      ${
        !data.isDigital
          ? `
        <div style="background: #182234; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #f59e0b; font-size: 15px;">📦 ACTION REQUIRED: PACK & DISPATCH</h3>
          <p style="margin: 4px 0; font-size: 13px; color: #cbd5e1;">Recipient: <strong style="color: #ffffff;">${data.buyerName}</strong></p>
          <p style="margin: 4px 0; font-size: 13px; color: #cbd5e1;">Delivery Address: <span style="color: #ffffff;">${data.shippingAddress}, ${data.shippingCity}, ${data.shippingState} - ${data.shippingPostalCode}</span></p>
          <p style="margin: 4px 0; font-size: 13px; color: #cbd5e1;">Recipient Phone (for courier OTP): <strong style="color: #f59e0b;">${data.shippingPhone || 'Contact Support'}</strong></p>
          <p style="margin-top: 12px; font-size: 12px; color: #94a3b8;">
            Please adhere to the Artelio Museum-Grade Packaging Protocol (glassine paper + corner guards + bubble wrap).
          </p>
        </div>
        `
          : ''
      }

      <div style="text-align: center; margin: 32px 0;">
        <a href="${siteUrl}/dashboard" style="background: #f59e0b; color: #000000; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 9999px; display: inline-block;">
          Open Studio Dashboard & Print Dispatch Slip
        </a>
      </div>
    </div>
  `;

  // If a transactional mail provider API key is present (Resend / SendGrid), send live
  if (process.env.RESEND_API_KEY && data.buyerEmail) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Artelio Atelier <concierge@artelio.in>',
          to: [data.buyerEmail],
          subject: buyerSubject,
          html: buyerHtml,
        }),
      });

      if (data.artistEmail) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Artelio Atelier <concierge@artelio.in>',
            to: [data.artistEmail],
            subject: artistSubject,
            html: artistHtml,
          }),
        });
      }
    } catch (err) {
      console.error('[Artelio Mailer] Live dispatch error:', err);
    }
  } else {
    // Graceful fallback: log the generated email records for auditing
    console.log('[Artelio Mailer] Mock Transactional Emails Queued:');
    console.log('Collector Subject:', buyerSubject);
    console.log('Artist Subject:', artistSubject);
  }

  return { success: true };
}

export async function sendDispatchEmail({
  orderId,
  artworkTitle,
  buyerName,
  buyerEmail,
  courierName,
  trackingNumber,
  trackingUrl,
}: {
  orderId: string;
  artworkTitle: string;
  buyerName: string;
  buyerEmail?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artelio.in';

  const subject = `Your artwork "${artworkTitle}" has been dispatched via ${courierName || 'Insured Courier'}`;
  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #0f141f; color: #ffffff; padding: 32px; border-radius: 16px;">
      <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 8px;">ARTELIO ATELIER</h1>
      <p style="font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Artwork Dispatched</p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
      
      <p style="font-size: 16px; line-height: 1.6;">Hello ${buyerName},</p>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
        Exciting news! Your fine art piece <strong>"${artworkTitle}"</strong> has finished curatorial packaging and is officially on its way to you.
      </p>

      <div style="background: #182234; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #f8fafc; font-size: 15px;">Courier Logistics Details</h3>
        <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">Courier Partner: <strong style="color: #ffffff;">${courierName || 'Insured Courier'}</strong></p>
        ${trackingNumber ? `<p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">Tracking / AWB Number: <strong style="color: #f59e0b; font-family: monospace;">${trackingNumber}</strong></p>` : ''}
        ${
          trackingUrl
            ? `<div style="margin-top: 16px;">
                <a href="${trackingUrl}" style="background: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; padding: 8px 20px; border-radius: 9999px; display: inline-block;">
                  Track Live Shipment ↗
                </a>
              </div>`
            : ''
        }
      </div>

      <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
        Upon arrival, please inspect your piece within 48 hours under our <strong>Artelio Transit Guarantee</strong>.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${siteUrl}/orders" style="background: #d97706; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 9999px; display: inline-block;">
          View Order Status & Certificate of Authenticity
        </a>
      </div>
    </div>
  `;

  if (process.env.RESEND_API_KEY && buyerEmail) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Artelio Atelier <concierge@artelio.in>',
          to: [buyerEmail],
          subject,
          html,
        }),
      });
    } catch (err) {
      console.error('[Artelio Mailer] Live dispatch email error:', err);
    }
  } else {
    console.log('[Artelio Mailer] Mock Dispatch Email Queued to:', buyerEmail, subject);
  }

  return { success: true };
}
