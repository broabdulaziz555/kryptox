'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function PublicProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendAmount, setSendAmount] = useState('');
  const [currency, setCurrency] = useState('USDT'); // fixed: use 'currency' not 'coin'
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get(`/users/${username}`)
      .then(d => { setUser(d.user); setLoading(false); })
      .catch(() => setLoading(false));
  }, [username]);

  const colors = ['#7B5EA7', '#00D97E', '#F0B429', '#4FACFE', '#FF4D4D'];
  const color = username ? colors[username.charCodeAt(0) % colors.length] : '#7B5EA7';

  const handleSend = async () => {
    const token = localStorage.getItem('kryptox_token');
    if (!token) { router.push('/onboarding'); return; }
    if (!sendAmount || isNaN(sendAmount) || +sendAmount <= 0) { setErr('Enter a valid amount'); return; }
    setSending(true); setErr('');
    try {
      await api.post('/wallet/send', {
        toUsername: username,
        amount: sendAmount,
        currency, // correct field name
        note
      });
      setDone(true);
    } catch (e) {
      setErr(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7B5EA7] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-6xl mb-4">👤</div>
        <div className="text-white font-bold text-xl mb-2">User not found</div>
        <p className="text-[#8888AA] mb-6">@{username} doesn't exist on KRYPTOX</p>
        <button onClick={() => router.push('/')} className="bg-[#7B5EA7] text-white px-6 py-3 rounded-2xl font-semibold">Get KRYPTOX</button>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-6xl mb-4 animate-bounce">✅</div>
        <div className="text-white font-bold text-xl mb-2">Sent!</div>
        <p className="text-[#8888AA] mb-1">{sendAmount} {currency} → @{username}</p>
        <button onClick={() => router.push('/dashboard/home')} className="bg-[#7B5EA7] text-white px-6 py-3 rounded-2xl font-semibold mt-4 block mx-auto">
          Go Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="flex items-center gap-3 p-4 pt-12">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center text-[#8888AA]">←</button>
        <span className="text-white font-semibold">Profile</span>
      </div>

      <div className="px-4 space-y-4">
        {/* Avatar */}
        <div className="text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3"
            style={{ backgroundColor: color + '30', color }}>
            {username[0].toUpperCase()}
          </div>
          <h1 className="text-white font-bold text-2xl">@{username}</h1>
          {user.bio && <p className="text-[#8888AA] mt-1">{user.bio}</p>}
          {user.isVerified && <span className="inline-block mt-2 text-xs bg-[#F0B429]/20 text-[#F0B429] px-2 py-0.5 rounded-full">✓ Verified</span>}
        </div>

        {/* Send form */}
        <div className="bg-[#12121A] rounded-2xl border border-[#2A2A3A] p-4 space-y-3">
          <h2 className="text-white font-semibold">Send crypto</h2>
          <div className="flex gap-2">
            <input
              type="number"
              value={sendAmount}
              onChange={e => setSendAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-[#1A1A26] text-white rounded-xl px-4 py-3 text-lg font-mono border border-[#2A2A3A] focus:border-[#7B5EA7] outline-none"
            />
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="bg-[#1A1A26] text-white rounded-xl px-3 py-3 border border-[#2A2A3A] focus:border-[#7B5EA7] outline-none"
            >
              {['USDT', 'ETH', 'BTC', 'SOL', 'BNB', 'TON'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="w-full bg-[#1A1A26] text-white rounded-xl px-4 py-3 text-sm border border-[#2A2A3A] focus:border-[#7B5EA7] outline-none"
          />
          {err && <p className="text-[#FF4D4D] text-sm">{err}</p>}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full bg-[#7B5EA7] hover:bg-[#9B7EC8] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending...' : `Send to @${username}`}
          </button>
        </div>

        {/* KRYPTOX promo */}
        <div className="bg-gradient-to-r from-[#7B5EA7]/10 to-[#12121A] rounded-2xl border border-[#7B5EA7]/20 p-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div className="flex-1">
            <div className="text-white text-sm font-semibold">Send crypto like a message</div>
            <div className="text-[#8888AA] text-xs">Join KRYPTOX — free, instant, global</div>
          </div>
          <button onClick={() => router.push('/onboarding')} className="text-[#7B5EA7] text-sm font-semibold whitespace-nowrap">Join →</button>
        </div>
      </div>
    </div>
  );
}
