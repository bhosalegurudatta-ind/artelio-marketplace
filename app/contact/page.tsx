'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Order / Delivery Inquiry');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
    setSending(false);
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-14 text-white">
      <div className="border-b border-white/10 pb-6 mb-8">
        <Link href="/" className="text-xs font-semibold text-brand hover:underline">
          ← Back to Artelio
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Contact Us &amp; Concierge</h1>
        <p className="mt-2 text-xs text-white/50">Dedicated Collector &amp; Artist Support • Response within 24 Hours</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Left Column: Direct details */}
        <div className="md:col-span-5 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-white">Support Channels</h2>
            
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">COLLECTOR &amp; ARTIST HELP</p>
              <a href="mailto:support@artelio.com" className="text-sm font-semibold text-brand hover:underline">
                support@artelio.com
              </a>
              <p className="text-xs text-white/50 mt-0.5">SLA: Under 24 hours (Monday to Saturday)</p>
            </div>

            <div className="border-t border-white/5 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">HEADQUARTERS</p>
              <p className="text-xs text-white/80 leading-relaxed mt-1">
                Artelio Fine Art Atelier Marketplace<br />
                BKC Financial Centre, Bandra East<br />
                Mumbai, Maharashtra 400051, India
              </p>
            </div>
          </div>

          {/* Grievance Officer statutory card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2 text-xs">
            <p className="font-bold uppercase tracking-wider text-marigold text-[11px]">
              Grievance Redressal Officer
            </p>
            <p className="text-white/80">
              In accordance with Consumer Protection (E-Commerce) Rules, 2020:
            </p>
            <p className="font-semibold text-white">Name: <span className="font-normal text-white/80">Grievance Desk, Artelio</span></p>
            <p className="font-semibold text-white">Email: <span className="font-normal text-brand hover:underline">grievance@artelio.com</span></p>
            <p className="text-[11px] text-white/50">Acknowledgment within 48h, resolution within 1 month.</p>
          </div>
        </div>

        {/* Right Column: Contact form */}
        <div className="md:col-span-7">
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-6 md:p-8">
            <h2 className="font-serif text-xl font-bold text-white">Send Us a Message</h2>
            <p className="mt-1 text-xs text-white/60">
              Questions regarding artwork authenticity, framing, courier tracking, or artist onboarding?
            </p>

            {sent ? (
              <div className="mt-8 rounded-xl border border-malachite/30 bg-malachite/10 p-6 text-center">
                <span className="text-3xl">✓</span>
                <h3 className="mt-2 text-sm font-bold text-white">Thank you for reaching out</h3>
                <p className="mt-1 text-xs text-white/70">
                  Our concierge team has received your ticket and will respond to <strong className="text-white">{email}</strong> within 24 hours.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-4 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80">Subject *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-xs text-white focus:border-brand focus:outline-none"
                  >
                    <option value="Order / Delivery Inquiry" className="bg-[#121826]">Order Delivery &amp; Tracking</option>
                    <option value="Artist Verification / Payouts" className="bg-[#121826]">Artist Studio &amp; Payouts</option>
                    <option value="Authenticity & Damage Claim" className="bg-[#121826]">Authenticity or Damage Claim</option>
                    <option value="General Question" className="bg-[#121826]">General Question / Partnership</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/80">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/80">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. vikram@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80">Message *</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe how we can assist you..."
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white placeholder:text-white/30 focus:border-brand focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand py-3 text-xs font-bold text-white shadow-md hover:shadow-art-glow transition-all disabled:opacity-50"
                >
                  {sending ? 'Sending message…' : 'Submit Ticket to Artelio Concierge'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
