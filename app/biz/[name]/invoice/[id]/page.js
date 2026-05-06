'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const STATUS_CONFIG = {
  PENDING:   { label: 'Awaiting Payment', color: '#F0B429', icon: '⏳' },
  PAID:      { label: 'Paid',             color: '#00D97E', icon: '✅' },
  EXPIRED:   { label: 'Expired',          color: '#FF4D4D', icon: '❌' },
  CANCELLED: { label: 'Cancelled',        color: '#8888AA', icon: '🚫' },
};

export default function InvoicePage() {
  const { name, id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [err, setErr] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    api.get(`/invoice/${id}`)
      .then(d => { setInvoice(d.invoice); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!invoice?.expiresAt) return;
    const tick = () => {
      const diff = new Date(invoice.expiresAt) - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [invoice]);

  const handlePay = async () => {
    const token = localStorage.getItem('kryptox_token');
    if (!token) { router.push('/onboarding'); return; }
    setPaying(true); setErr('');
    try {
      await api.post(`/invoice/${id}/pay`, {});
      setPaid(true);
    } catch (e) {
      setErr(e.message || 'Payment failed');
    } finally { setPaying(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F0B429] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!invoice) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-6xl mb-4">📄</div>
        <div className="text-white font-bold text-xl mb-2">Invoice not found</div>
        <button onClick={() => router.push('/')} className="mt-4 text-[#7B5EA7]">Go home →</button>
      </div>
    </div>
  );

  const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING;

  if (paid || invoice.status === 'PAID') return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-7xl mb-4">✅</div>
        <div className="text-white font-bold text-2xl mb-2">Payment Sent!</div>
        {/* Use invoice.currency — the correct field from Prisma */}
        <p className="text-[#8888AA] mb-1">{invoice.amount} {invoice.currency}</p>
        <p className="text-[#8888AA] text-sm mb-6">to @{invoice.businessUsername || name}</p>
        <button onClick={() => router.push('/dashboard/home')} className="bg-[#7B5EA7] text-white px-6 py-3 rounded-2xl font-semibold">
          Back to Home
        </button>
      </div>
    </div>
  );

  const canPay = invoice.status === 'PENDING' && timeLeft !== 'Expired';

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="flex items-center gap-3 p-4 pt-12">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center text-[#8888AA]">←</button>
        <span className="text-white font-semibold">Invoice</span>
      </div>

      <div className="px-4 space-y-4">
        {/* Status badge */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: statusCfg.color + '20', color: statusCfg.color }}>
            <span>{statusCfg.icon}</span>
            <span className="text-sm font-medium">{statusCfg.label}</span>
          </div>
        </div>

        {/* Invoice card */}
        <div className="bg-[#12121A] rounded-2xl border border-[#2A2A3A] p-5 space-y-4">
          {/* Business */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#F0B429]/20 flex items-center justify-center text-2xl">🏪</div>
            <div>
              <div className="text-white font-semibold">
                {invoice.business?.username ? `@${invoice.business.username}` : `@${name}`}
              </div>
              <div className="text-[#8888AA] text-sm">@{invoice.businessUsername || name}</div>
            </div>
          </div>

          <div className="border-t border-[#2A2A3A]" />

          {/* Amount — use invoice.currency, not invoice.coin */}
          <div className="text-center py-2">
            <div className="text-[#8888AA] text-sm mb-1">Amount Due</div>
            <div className="text-white font-bold text-4xl">{invoice.amount}</div>
            <div className="text-[#F0B429] font-semibold text-xl mt-1">{invoice.currency}</div>
          </div>

          {invoice.description && (
            <>
              <div className="border-t border-[#2A2A3A]" />
              <div>
                <div className="text-[#8888AA] text-xs mb-1">Description</div>
                <div className="text-white text-sm">{invoice.description}</div>
              </div>
            </>
          )}

          <div className="border-t border-[#2A2A3A]" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[#8888AA] text-xs">Invoice</div>
              <div className="text-white font-mono text-xs">{invoice.invoiceNumber || id.slice(0, 12)}</div>
            </div>
            {timeLeft && invoice.status === 'PENDING' && (
              <div>
                <div className="text-[#8888AA] text-xs">Expires in</div>
                <div style={{ color: timeLeft === 'Expired' ? '#FF4D4D' : '#F0B429' }} className="font-mono font-semibold text-sm">
                  {timeLeft}
                </div>
              </div>
            )}
          </div>
        </div>

        {err && <p className="text-[#FF4D4D] text-sm text-center bg-[#FF4D4D]/10 rounded-xl p-3">{err}</p>}

        {canPay && (
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full bg-[#F0B429] hover:bg-[#F0B429]/80 text-black font-bold py-4 rounded-2xl text-lg transition-colors disabled:opacity-50"
          >
            {paying ? 'Processing...' : `Pay ${invoice.amount} ${invoice.currency}`}
          </button>
        )}

        <div className="text-center py-2">
          <p className="text-[#8888AA] text-sm">Don't have KRYPTOX?{' '}
            <button onClick={() => router.push('/onboarding')} className="text-[#7B5EA7] font-semibold">Sign up free →</button>
          </p>
        </div>
      </div>
    </div>
  );
}
