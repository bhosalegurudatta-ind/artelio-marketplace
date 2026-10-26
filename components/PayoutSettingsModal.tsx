'use client';

import { useState, useEffect } from 'react';

type PayoutData = {
  configured: boolean;
  method: 'upi' | 'bank';
  upiId: string;
  accountHolder: string;
  bankName: string;
  ifsc: string;
  accountNumberMasked?: string | null;
};

export default function PayoutSettingsModal({
  isOpen,
  onClose,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [accountHolder, setAccountHolder] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentConfig, setCurrentConfig] = useState<PayoutData | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    async function fetchSettings() {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) return;

        const res = await fetch('/api/artist/payout-settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: PayoutData = await res.json();
        if (res.ok) {
          setCurrentConfig(data);
          if (data.configured) {
            setMethod(data.method || 'upi');
            setAccountHolder(data.accountHolder || '');
            setUpiId(data.upiId || '');
            setBankName(data.bankName || '');
            setIfsc(data.ifsc || '');
          }
        }
      } catch (err) {
        console.error('Failed to load payout settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (method === 'bank') {
      if (!currentConfig?.configured && accountNumber !== confirmAccount) {
        setErrorMsg('Bank account numbers do not match.');
        return;
      }
      if (currentConfig?.configured && accountNumber && accountNumber !== confirmAccount) {
        setErrorMsg('Bank account numbers do not match.');
        return;
      }
    }

    setSaving(true);

    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const payload = {
        method,
        accountHolder,
        upiId: method === 'upi' ? upiId : undefined,
        bankName: method === 'bank' ? bankName : undefined,
        accountNumber: method === 'bank' ? accountNumber : undefined,
        ifsc: method === 'bank' ? ifsc.toUpperCase() : undefined,
      };

      const res = await fetch('/api/artist/payout-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.error || 'Failed to save payout settings.');
        setSaving(false);
        return;
      }

      setSuccessMsg('Payout details saved successfully!');
      setSaving(false);
      onUpdated();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121826] p-6 text-white shadow-2xl md:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-white">Artist Payout Settings</h2>
            <p className="text-xs text-white/60">Where should Artelio deposit your 90% artwork earnings?</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-white/60">Loading existing settings…</div>
        ) : (
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="rounded-xl border border-vermilion/30 bg-vermilion/10 p-3 text-xs text-vermilion">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="rounded-xl border border-malachite/30 bg-malachite/10 p-3 text-xs text-malachite">
                ✓ {successMsg}
              </div>
            )}

            {/* Method Selector Tabs */}
            <div>
              <label className="block text-xs font-semibold text-white/80">Preferred Settlement Channel</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('upi')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                    method === 'upi'
                      ? 'border-brand bg-brand/10 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span className="text-base">⚡</span>
                  UPI ID (Instant)
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('bank')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                    method === 'bank'
                      ? 'border-brand bg-brand/10 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span className="text-base">🏦</span>
                  Direct Bank (NEFT/IMPS)
                </button>
              </div>
            </div>

            {/* Account Holder Name (common to both) */}
            <div>
              <label className="block text-xs font-semibold text-white/80">
                Official Account Holder Name *
              </label>
              <input
                type="text"
                required
                placeholder="Name as registered with your bank / UPI"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
              />
            </div>

            {/* UPI Fields */}
            {method === 'upi' && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80">UPI VPA ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. artistname@okaxis, 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
                  />
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-white/50">
                    <span>Common handles:</span>
                    <button type="button" onClick={() => setUpiId((prev) => prev.split('@')[0] + '@okaxis')} className="hover:text-brand">@okaxis</button>
                    <span>·</span>
                    <button type="button" onClick={() => setUpiId((prev) => prev.split('@')[0] + '@okhdfcbank')} className="hover:text-brand">@okhdfcbank</button>
                    <span>·</span>
                    <button type="button" onClick={() => setUpiId((prev) => prev.split('@')[0] + '@ybl')} className="hover:text-brand">@ybl</button>
                    <span>·</span>
                    <button type="button" onClick={() => setUpiId((prev) => prev.split('@')[0] + '@paytm')} className="hover:text-brand">@paytm</button>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Fields */}
            {method === 'bank' && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80">Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank, State Bank of India, ICICI"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80">
                    Bank Account Number *
                    {currentConfig?.accountNumberMasked && (
                      <span className="ml-2 font-normal text-white/40">
                        (Current: {currentConfig.accountNumberMasked})
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    required={!currentConfig?.configured}
                    placeholder={currentConfig?.configured ? 'Leave blank to keep unchanged' : '9 to 18 digits'}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
                  />
                </div>

                {(accountNumber || !currentConfig?.configured) && (
                  <div>
                    <label className="block text-xs font-semibold text-white/80">
                      Confirm Account Number *
                    </label>
                    <input
                      type="text"
                      required={!currentConfig?.configured || Boolean(accountNumber)}
                      placeholder="Re-enter bank account number"
                      value={confirmAccount}
                      onChange={(e) => setConfirmAccount(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-white/80">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="e.g. HDFC0001234"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm uppercase text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="rounded-xl bg-ink/30 p-3 text-[11px] text-white/60">
              🔒 <span className="font-semibold text-white">Security & Escrow Policy:</span> Artelio charges a 10% platform fee and releases the 90% balance directly to your registered destination once transit is completed.
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-6 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-art-glow transition-all disabled:opacity-50"
              >
                {saving ? 'Saving Details…' : 'Save Payout Details'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
