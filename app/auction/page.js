'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import { api } from '@/lib/api';

function AuctionCard({ auction, onBid }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(auction.endsAt) - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [auction.endsAt]);

  const isEnding = timeLeft !== 'Ended' && !timeLeft.includes('h') && timeLeft.includes(':');

  return (
    <div className="bg-[#12121A] rounded-2xl border border-[#2A2A3A] hover:border-[#F0B429]/40 transition-all p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xl font-mono">@{auction.username}</span>
            {auction.bidCount > 3 && (
              <span className="text-[10px] bg-[#FF4D4D]/20 text-[#FF4D4D] px-2 py-0.5 rounded-full">🔥 HOT</span>
            )}
          </div>
          <div className="text-[#8888AA] text-xs mt-0.5">{auction.bidCount || 0} bids</div>
        </div>
        <div className="text-right text-sm">
          {timeLeft === 'Ended' ? (
            <span className="text-[#FF4D4D] text-sm">Ended</span>
          ) : (
            <>
              <div className="text-[#8888AA] text-xs">Ends in</div>
              <div className={`font-mono font-semibold ${isEnding ? 'text-[#FF4D4D]' : 'text-white'}`}>{timeLeft}</div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[#8888AA] text-xs">Current bid</div>
          <div className="text-[#F0B429] font-bold text-lg">{auction.currentBid} USDT</div>
        </div>
        {timeLeft !== 'Ended' && (
          <button
            onClick={() => onBid(auction)}
            className="px-5 py-2 bg-[#F0B429] hover:bg-[#F0B429]/80 text-black font-bold rounded-xl text-sm transition-colors"
          >
            Bid
          </button>
        )}
      </div>
    </div>
  );
}

function BidModal({ auction, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const minBid = Math.floor(parseFloat(auction.currentBid) + 1);

  const handleBid = async () => {
    if (!amount || +amount < minBid) { setErr(`Minimum bid is ${minBid} USDT`); return; }
    setLoading(true); setErr('');
    try {
      // fixed: send 'amount' not 'bidAmount'
      await api.post('/auction/bid', { username: auction.username, amount });
      onSuccess();
    } catch (e) {
      setErr(e.message || 'Bid failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-[#12121A] rounded-t-3xl border-t border-[#2A2A3A] p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-[#2A2A3A] rounded-full mx-auto" />
        <h2 className="text-white font-bold text-xl">Bid on @{auction.username}</h2>
        <div className="bg-[#1A1A26] rounded-xl p-3">
          <div className="text-[#8888AA] text-xs mb-1">Current highest bid</div>
          <div className="text-[#F0B429] font-bold text-2xl">{auction.currentBid} USDT</div>
        </div>
        <div>
          <label className="text-[#8888AA] text-sm block mb-1">Your bid (min {minBid} USDT)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={String(minBid)}
              className="flex-1 bg-[#1A1A26] text-white rounded-xl px-4 py-3 text-lg font-mono border border-[#2A2A3A] focus:border-[#F0B429] outline-none"
            />
            <span className="text-[#8888AA]">USDT</span>
          </div>
        </div>
        {err && <p className="text-[#FF4D4D] text-sm">{err}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-[#1A1A26] text-[#8888AA] border border-[#2A2A3A]">Cancel</button>
          <button onClick={handleBid} disabled={loading} className="flex-1 py-3 rounded-xl bg-[#F0B429] text-black font-bold disabled:opacity-50">
            {loading ? 'Placing...' : 'Place Bid'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuctionPage() {
  const [active, setActive] = useState([]);
  const [ended, setEnded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [bidTarget, setBidTarget] = useState(null);

  const load = async () => {
    try {
      const [a, e] = await Promise.all([
        api.get('/auction/active'),
        api.get('/auction/ended')
      ]);
      setActive(a.auctions || []);
      setEnded(e.auctions || []);
    } catch (e) {
      console.error('Auction load error:', e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleBidSuccess = () => { setBidTarget(null); load(); };

  return (
    <MobileLayout title="Username Auctions" showBack>
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-[#F0B429]/20 to-[#7B5EA7]/20 rounded-2xl border border-[#F0B429]/20 p-4 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <h2 className="text-white font-bold">Premium @Usernames</h2>
          <p className="text-[#8888AA] text-sm mt-1">Own the most coveted handles on KRYPTOX. Highest bidder wins.</p>
        </div>

        <div className="flex gap-2">
          {[['active', '🔥 Active'], ['ended', '✅ Ended']].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-[#F0B429] text-black' : 'bg-[#1A1A26] text-[#8888AA]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10 text-[#8888AA]">Loading auctions...</div>
        ) : tab === 'active' ? (
          active.length === 0 ? (
            <div className="text-center py-10"><div className="text-4xl mb-2">🏷️</div><p className="text-[#8888AA]">No active auctions right now</p></div>
          ) : (
            <div className="space-y-3">{active.map(a => <AuctionCard key={a.username} auction={a} onBid={setBidTarget} />)}</div>
          )
        ) : (
          ended.length === 0 ? (
            <div className="text-center py-10"><p className="text-[#8888AA]">No ended auctions yet</p></div>
          ) : (
            <div className="space-y-3">
              {ended.map(a => (
                <div key={a.username} className="bg-[#12121A] rounded-2xl border border-[#2A2A3A] p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold font-mono">@{a.username}</span>
                      <div className="text-[#8888AA] text-xs mt-0.5">{a.bidCount || 0} bids</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#F0B429] font-bold">{a.currentBid} USDT</div>
                      {a.winnerUsername && <div className="text-[#00D97E] text-xs">Won by @{a.winnerUsername}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        <div className="bg-[#12121A] rounded-2xl border border-[#2A2A3A] p-4 space-y-3">
          <h3 className="text-white font-semibold">How it works</h3>
          {[
            ['1', 'Browse active auctions and place a bid in USDT'],
            ['2', 'Outbid others before the timer ends'],
            ['3', 'Highest bidder wins the @username permanently'],
            ['4', 'Losing bids are fully refunded automatically'],
          ].map(([n, text]) => (
            <div key={n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#F0B429]/20 text-[#F0B429] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{n}</div>
              <p className="text-[#8888AA] text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {bidTarget && (
        <BidModal auction={bidTarget} onClose={() => setBidTarget(null)} onSuccess={handleBidSuccess} />
      )}
    </MobileLayout>
  );
}
