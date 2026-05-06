'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function ClaimPage() {
  const { token } = useParams();
  const router = useRouter();
  const [claimInfo, setClaimInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get(`/wallet/claim/${token}`)
      .then(d => { setClaimInfo(d); setLoading(false); })
      .catch(e => { setErr(e.message || 'Invalid link'); setLoading(false); });
  }, [token]);

  const doClaim = async () => {
    const tkn = localStorage.getItem('kryptox_token');
    if (!tkn) {
      sessionStorage.setItem('pending_claim', token);
      router.push('/onboarding');
      return;
    }
    setClaiming(true); setErr('');
    try {
      await api.post(`/wallet/claim/${token}`, {});
      setClaimed(true);
    } catch (e) {
      setErr(e.message || 'Claim failed');
    } finally { setClaiming(false); }
  };

  // If we returned from onboarding with a pending claim, auto-claim
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_claim');
    const tkn = localStorage.getItem('kryptox_token');
    if (pending === token && tkn && claimInfo) {
      sessionStorage.removeItem('pending_claim');
      doClaim();
    }
  }, [claimInfo]);

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00D97E] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (claimed) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-7xl mb-4 animate-bounce">🎉</div>
        <div className="text-white font-bold text-2xl mb-2">Claimed!</div>
        {/* Use claimInfo.currency — correct field from API */}
        <p className="text-[#00D97E] font-semibold text-lg mb-1">{claimInfo?.amount} {claimInfo?.currency}</p>
        <p className="text-[#8888AA] text-sm mb-6">has been added to your wallet</p>
        <button onClick={() => router.push('/dashboard/home')} className="bg-[#7B5EA7] text-white px-8 py-3 rounded-2xl font-semibold">
          View Balance →
        </button>
      </div>
    </div>
  );

  if (err && !claimInfo) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-6xl mb-4">💔</div>
        <div className="text-white font-bold text-xl mb-2">Link Expired</div>
        <p className="text-[#8888AA] mb-6">This claim link has already been used or is invalid.</p>
        <button onClick={() => router.push('/')} className="text-[#7B5EA7]">Go to KRYPTOX →</button>
      </div>
    </div>
  );

  // claimInfo.from.username — correct API shape (not claimInfo.senderUsername)
  const senderUsername = claimInfo?.from?.username;

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#00D97E]/10 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
        <div className="w-24 h-24 rounded-full bg-[#00D97E]/20 flex items-center justify-center mb-6 animate-pulse">
          <span className="text-5xl">🎁</span>
        </div>

        <p className="text-[#8888AA] text-sm mb-1">
          {senderUsername ? `@${senderUsername} sent you` : 'You received'}
        </p>
        <div className="text-white font-bold text-5xl mb-1">{claimInfo?.amount}</div>
        {/* Use claimInfo.currency — correct field */}
        <div className="text-[#00D97E] font-bold text-2xl mb-6">{claimInfo?.currency}</div>

        {claimInfo?.note && (
          <div className="bg-[#12121A] rounded-2xl px-5 py-3 mb-6 max-w-xs">
            <p className="text-white/80 text-sm italic">"{claimInfo.note}"</p>
          </div>
        )}

        <div className="bg-[#12121A] rounded-2xl border border-[#00D97E]/20 p-5 w-full max-w-sm mb-6 space-y-3">
          <h2 className="text-white font-bold text-lg">Claim your crypto</h2>
          <p className="text-[#8888AA] text-sm">You need a KRYPTOX account to receive this. It's free and takes 30 seconds.</p>
          {err && <p className="text-[#FF4D4D] text-sm">{err}</p>}
          <button
            onClick={doClaim}
            disabled={claiming}
            className="w-full bg-[#00D97E] hover:bg-[#00D97E]/80 text-black font-bold py-4 rounded-2xl text-lg transition-colors disabled:opacity-50"
          >
            {claiming ? 'Claiming...' : '🎉 Claim Now'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-sm text-center">
          {[['⚡', 'Instant', 'Send in seconds'], ['🔒', 'Secure', 'Non-custodial'], ['🌍', 'Global', '50+ countries']].map(([icon, title, sub]) => (
            <div key={title} className="bg-[#12121A]/60 rounded-xl p-3">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-white text-xs font-semibold">{title}</div>
              <div className="text-[#8888AA] text-[10px]">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
