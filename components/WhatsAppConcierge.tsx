'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function WhatsAppConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Phone number configured via environment variable, or fallback concierge line
  const rawPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';
  const phone = rawPhone.replace(/[^0-9]/g, '');

  useEffect(() => {
    let active = true;

    async function checkPremiumStatus() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          if (active) setIsPremiumUser(false);
          return;
        }

        const { data: profile } = await supabase
          .from('users')
          .select('role, paid_until')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (!active) return;

        // WhatsApp Concierge is strictly an exclusive perk for Premium Collector Users
        const isUserRole = profile?.role === 'customer' || !profile?.role;
        const hasActivePlan =
          profile?.paid_until && new Date(profile.paid_until).getTime() > Date.now();

        setIsPremiumUser(Boolean(isUserRole && hasActivePlan));
      } catch {
        if (active) setIsPremiumUser(false);
      }
    }

    checkPremiumStatus();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkPremiumStatus();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // If user is not logged in as a Premium Collector, do not display the widget
  if (!isPremiumUser) {
    return null;
  }

  const quickTopics = [
    {
      label: '🎨 Inquire about Artwork',
      text: 'Hello Artelio Concierge, I would like more information about an artwork on the gallery.',
    },
    {
      label: '📦 Track My Shipment',
      text: 'Hi Artelio, I need assistance tracking my recent art acquisition and courier delivery.',
    },
    {
      label: '💳 Payment & Escrow Question',
      text: 'Hello, I have a question regarding Razorpay checkout and Artelio escrow protection.',
    },
    {
      label: '✨ Custom Artist Commission',
      text: 'Hello, I would like to inquire about commissioning an original custom piece from an artist.',
    },
  ];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenWhatsApp = (customText?: string) => {
    const textToSend = customText || message.trim() || 'Hello Artelio Concierge, I would like assistance with the marketplace.';
    const encoded = encodeURIComponent(textToSend);
    const url = `https://wa.me/${phone}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setHasInteracted(true);
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Concierge Popover Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Artelio WhatsApp Art Concierge"
          className="mb-3 w-[calc(100vw-3rem)] max-w-sm rounded-2xl border border-amber-500/30 bg-[#0F1420]/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(245, 158, 11, 0.15)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20">
                <span className="font-serif text-lg">A</span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0F1420] bg-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                  Artelio VIP Concierge
                  <span className="inline-block rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    VIP Pass
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Direct VIP Curator Line</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close Concierge"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body Intro */}
          <div className="py-3">
            <p className="text-xs leading-relaxed text-slate-300">
              Welcome, VIP Collector. Connect directly with our senior curator team on WhatsApp for exclusive fine art acquisitions, framing advice, or private commissions.
            </p>

            {/* Quick action chips */}
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
                Frequently Asked
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {quickTopics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => handleOpenWhatsApp(topic.text)}
                    className="flex items-center justify-between w-full text-left rounded-lg border border-white/5 bg-white/5 px-2.5 py-2 text-xs text-slate-200 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300 transition-all group"
                  >
                    <span>{topic.label}</span>
                    <span className="text-slate-500 group-hover:text-amber-400 text-xs">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom inquiry input */}
            <div className="mt-3">
              <label htmlFor="concierge-msg" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Or Send a Custom Message
              </label>
              <div className="relative">
                <textarea
                  id="concierge-msg"
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your question here…"
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => handleOpenWhatsApp()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98]"
            >
              {/* WhatsApp SVG Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>Connect on WhatsApp</span>
            </button>
          </div>

          {/* Quick Help Footer Links */}
          <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-slate-400">
            <Link
              href="/track"
              onClick={() => setIsOpen(false)}
              className="hover:text-amber-400 transition-colors"
            >
              📦 Track Order
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="hover:text-amber-400 transition-colors"
            >
              ✉️ Email Concierge
            </Link>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">Escrow Protected</span>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Open Artelio WhatsApp Art Concierge"
        className={`group relative flex items-center gap-2.5 rounded-full px-4 py-3 text-white shadow-xl transition-all duration-300 active:scale-95 ${
          isOpen
            ? 'bg-slate-800 text-amber-400 border border-amber-500/40 shadow-amber-950/40'
            : 'bg-[#0F1420] border border-emerald-500/40 hover:border-emerald-400 shadow-emerald-950/50 hover:shadow-emerald-500/20'
        }`}
        style={{
          boxShadow: isOpen
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(245, 158, 11, 0.2)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.25)',
        }}
      >
        {/* Animated ambient pulse ring when closed and not interacted */}
        {!isOpen && !hasInteracted && (
          <span className="absolute -inset-1 rounded-full border border-emerald-400/30 animate-ping pointer-events-none" />
        )}

        {/* WhatsApp Icon with Status Dot */}
        <div className="relative flex items-center justify-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0F1420] bg-emerald-400" />
        </div>

        {/* Text Label */}
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold tracking-wide text-slate-100 group-hover:text-white">
            {isOpen ? 'Close Concierge' : 'Art Concierge'}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">
            {isOpen ? 'Tap to minimize' : 'Chat on WhatsApp'}
          </span>
        </div>
      </button>
    </div>
  );
}
