'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function BizProfilePage() {
  const { name } = useParams();
  const router = useRouter();
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  // Note: public business invoices can only be shown if the business shares them.
  // We don't have a public invoice list endpoint, so we show a "pay / message" CTA only.

  useEffect(() => {
    api.get(`/users/${name}`)
      .then(d => { setBiz(d.user); setLoading(false); })
      .catch(() => setLoading(false));
  }, [name]);

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F0B429] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!biz || !biz.isBusiness) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-6xl mb-4">🏪</div>
        <div className="text-white font-bold text-xl mb-2">Business not found</div>
        <p className="text-[#8888AA] mb-6">@{name} isn't a registered business on KRYPTOX</p>
        <button onClick={() => router.push('/')} className="bg-[#7B5EA7] text-white px-6 py-3 rounded-2xl font-semibold">Go to KRYPTOX</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="flex items-center gap-3 p-4 pt-12">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center text-[#8888AA]">←</button>
        <span className="text-white font-semibold">Business</span>
      </div>

      <div className="px-4 space-y-4">
        {/* Business header */}
        <div className="bg-[#12121A] rounded-2xl border border-[#2A2A3A] p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#F0B429]/20 flex items-center justify-center text-3xl flex-shrink-0">
              🏪
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-xl">@{biz.username}</h1>
                {biz.isVerified && <span className="text-[#F0B429]">✓</span>}
              </div>
              <span className="text-[#8888AA] text-xs bg-[#F0B429]/10 text-[#F0B429] px-2 py-0.5 rounded-full text-[10px] inline-block mt-1">BUSINESS</span>
              {biz.bio && <p className="text-white/80 text-sm mt-2">{biz.bio}</p>}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => router.push(`/dashboard/chat/${biz.username}`)}
              className="flex-1 py-2.5 rounded-xl bg-[#1A1A26] text-white text-sm font-medium hover:bg-[#2A2A3A] transition-colors border border-[#2A2A3A]"
            >
              💬 Message
            </button>
            <button
              onClick={() => router.push(`/u/${biz.username}`)}
              className="flex-1 py-2.5 rounded-xl bg-[#7B5EA7] text-white text-sm font-medium hover:bg-[#9B7EC8] transition-colors"
            >
              💸 Send
            </button>
          </div>
        </div>

        {/* Business info */}
        <div className="bg-[#12121A] rounded-2xl border border-[#2A2A3A] p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm">About this business</h3>
          <div className="flex items-center gap-2 text-sm text-[#8888AA]">
            <span>✅</span><span>Accepts crypto payments instantly</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8888AA]">
            <span>🔒</span><span>Non-custodial — no chargebacks</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8888AA]">
            <span>⚡</span><span>19 coins supported</span>
          </div>
        </div>

        {/* Have an invoice? */}
        <div className="bg-gradient-to-r from-[#F0B429]/10 to-[#12121A] rounded-2xl border border-[#F0B429]/20 p-4">
          <div className="text-white font-semibold text-sm mb-1">Have an invoice link?</div>
          <p className="text-[#8888AA] text-xs mb-3">If @{biz.username} sent you an invoice link, tap it to pay directly.</p>
          <button
            onClick={() => router.push(`/dashboard/chat/${biz.username}`)}
            className="text-[#F0B429] text-sm font-semibold"
          >
            Open chat with @{biz.username} →
          </button>
        </div>

        <div className="text-center py-4">
          <div className="text-[#8888AA] text-xs">Powered by</div>
          <div className="text-white font-bold text-sm mt-0.5">⚡ KRYPTOX</div>
        </div>
      </div>
    </div>
  );
}
