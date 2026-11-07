import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return new NextResponse('Order ID required', { status: 400 });
    }

    // Try to get user if logged in (artists and buyers can view label)
    const user = await getUserFromRequest(req);

    // Fetch order details
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        shipped_at,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        courier_name,
        tracking_note,
        awb_number,
        courier,
        label_url,
        tracking_status,
        customer_id,
        artworks (
          id,
          title,
          price,
          medium,
          artist_id,
          ships_from,
          users (
            name,
            email
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return new NextResponse('Shipping label not found for this order.', { status: 404 });
    }

    const artwork: any = order.artworks;
    const awb = order.awb_number || order.tracking_note || `AWB-DEL-${order.id.slice(0, 8).toUpperCase()}`;
    const courierName = order.courier || order.courier_name || 'Delhivery Express';
    const artistUser = artwork?.users;
    const artistName = artistUser?.name || 'Artelio Studio Artist';
    const shipsFrom = artwork?.ships_from || 'Art Studio Atelier, India';

    const consigneeName = order.shipping_name || 'Art Collector';
    const consigneePhone = order.shipping_phone || '+91 Contact on Delivery';
    const consigneeAddress = order.shipping_address || 'Delivery Address on Record';
    const consigneeCity = order.shipping_city || '';
    const consigneeState = order.shipping_state || '';
    const consigneePin = order.shipping_postal_code || '000000';

    const artworkTitle = artwork?.title || 'Original Fine Artwork';
    const declaredValue = artwork?.price ? `₹${Number(artwork.price).toLocaleString('en-IN')}` : 'Insured Consignment';
    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Generate printable SVG barcode
    const barcodeBars = Array.from({ length: 48 }, (_, i) => {
      const width = (i % 3 === 0) ? 3 : (i % 2 === 0) ? 1.5 : 2;
      return `<rect x="${i * 5}" y="0" width="${width}" height="45" fill="#111827"/>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shipping Label • ${awb}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
    }
    .toolbar {
      width: 100%;
      max-width: 480px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .btn {
      background: #0f172a;
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { background: #1e293b; }
    .label-box {
      width: 100%;
      max-width: 480px;
      background: #ffffff;
      border: 2px solid #0f172a;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      overflow: hidden;
      font-size: 12px;
      line-height: 1.35;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 2px solid #0f172a;
      background: #fafafa;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .courier-badge {
      background: #0f172a;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .barcode-section {
      text-align: center;
      padding: 12px 14px 8px;
      border-bottom: 2px dashed #94a3b8;
    }
    .awb-text {
      font-family: "Courier New", Courier, monospace;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 2px;
      margin-top: 6px;
      color: #0f172a;
    }
    .routing-banner {
      display: flex;
      border-bottom: 2px solid #0f172a;
    }
    .routing-hub {
      flex: 1;
      padding: 8px 12px;
      border-right: 1px solid #0f172a;
      background: #f8fafc;
    }
    .routing-pin {
      flex: 1;
      padding: 8px 12px;
      background: #0f172a;
      color: #ffffff;
      text-align: right;
    }
    .routing-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
      font-weight: 600;
    }
    .routing-val {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .address-section {
      padding: 12px 14px;
      border-bottom: 1px solid #cbd5e1;
    }
    .to-section {
      background: #fff;
      border-bottom: 2px solid #0f172a;
    }
    .from-section {
      background: #fbfcfe;
    }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .person-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .address-line {
      font-size: 12px;
      color: #334155;
    }
    .phone-line {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 4px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 8px 14px;
      border-bottom: 2px solid #0f172a;
      gap: 6px;
      background: #f8fafc;
      font-size: 11px;
    }
    .details-item span {
      color: #64748b;
      display: block;
      font-size: 9px;
      text-transform: uppercase;
    }
    .details-item strong {
      color: #0f172a;
      font-size: 12px;
    }
    .fragile-banner {
      background: #fff1f2;
      border-bottom: 1px solid #fecdd3;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .fragile-badge {
      background: #e11d48;
      color: white;
      font-weight: 800;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      letter-spacing: 0.5px;
    }
    .fragile-text {
      font-size: 11px;
      font-weight: 600;
      color: #9f1239;
    }
    .footer-note {
      padding: 8px 14px;
      font-size: 9px;
      color: #64748b;
      text-align: center;
      background: #fafafa;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .label-box {
        max-width: 100%;
        border: 2px solid #000000;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="btn" onclick="window.print()">
      🖨️ Print Shipping Label
    </button>
    <a href="/orders" class="btn" style="background: #e2e8f0; color: #0f172a;">Back to Orders</a>
  </div>

  <div class="label-box">
    <!-- Header -->
    <div class="header-row">
      <div class="brand-title">ARTELIO • FINE ART CARGO</div>
      <div class="courier-badge">${courierName}</div>
    </div>

    <!-- Barcode & AWB -->
    <div class="barcode-section">
      <svg width="240" height="45" viewBox="0 0 240 45" style="display: inline-block;">
        ${barcodeBars}
      </svg>
      <div class="awb-text">${awb}</div>
    </div>

    <!-- Routing / Sorting Hub Code -->
    <div class="routing-banner">
      <div class="routing-hub">
        <div class="routing-label">DESTINATION HUB</div>
        <div class="routing-val">${consigneeCity ? consigneeCity.slice(0, 3).toUpperCase() : 'AIR'} / PRIORITY</div>
      </div>
      <div class="routing-pin">
        <div class="routing-label" style="opacity: 0.9;">PIN CODE</div>
        <div class="routing-val">${consigneePin}</div>
      </div>
    </div>

    <!-- Ship To (Consignee) -->
    <div class="address-section to-section">
      <div class="section-title">DELIVER TO (CONSIGNEE):</div>
      <div class="person-name">${consigneeName}</div>
      <div class="address-line">${consigneeAddress}</div>
      <div class="address-line">${consigneeCity}${consigneeState ? ', ' + consigneeState : ''} - <strong>${consigneePin}</strong></div>
      <div class="phone-line">📱 Mobile: ${consigneePhone}</div>
    </div>

    <!-- Ships From (Artist / Atelier) -->
    <div class="address-section from-section">
      <div class="section-title">SHIPPED FROM (ATELIER):</div>
      <div class="person-name" style="font-size: 13px;">${artistName}</div>
      <div class="address-line">${shipsFrom}</div>
      <div class="address-line" style="font-size: 11px; color: #64748b; margin-top: 2px;">Artelio Atelier Certified Studio</div>
    </div>

    <!-- Parcel & Insurance Details -->
    <div class="details-grid">
      <div class="details-item">
        <span>Artwork Description</span>
        <strong>${artworkTitle}</strong>
      </div>
      <div class="details-item">
        <span>Insured Value</span>
        <strong>${declaredValue}</strong>
      </div>
      <div class="details-item">
        <span>Order Reference</span>
        <strong>#${order.id.slice(0, 8).toUpperCase()}</strong>
      </div>
      <div class="details-item">
        <span>Booking Date</span>
        <strong>${orderDate}</strong>
      </div>
    </div>

    <!-- Fragile handling banner -->
    <div class="fragile-banner">
      <span class="fragile-badge">FRAGILE</span>
      <span class="fragile-text">MUSEUM-GRADE FINE ART • HANDLE WITH CARE • DO NOT BEND</span>
    </div>

    <!-- Footer -->
    <div class="footer-note">
      Insured Fine Art Logistics by Artelio Concierge • For delivery verification visit artelio.in/track
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err: any) {
    console.error('Print label route error:', err);
    return new NextResponse('Internal server error loading shipping label.', { status: 500 });
  }
}
