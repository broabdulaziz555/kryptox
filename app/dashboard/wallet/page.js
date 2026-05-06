'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import { api } from '@/lib/api';
import { formatUSD, formatAmount, getCoinLogo, shortenAddress, getCoinColors } from '@/lib/wallet';
import QRGenerator from '@/components/ui/QRGenerator';

const TABS     = ['Assets', 'Send', 'Receive', 'Swap'];
const NETWORKS = ['Ethereum','BSC','Polygon','Arbitrum','Optimism','Avalanche','Base','Solana','Bitcoin','Tron','TON'];
const SEND_COINS = ['USDT','ETH','BTC','SOL','BNB','USDC','TRX','TON'];

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ className='' }) { return <div className={`shimmer rounded-xl ${className}`} />; }

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg.text) return null;
  const ok = msg.type === 'success';
  return (
    <div className={`rounded-xl px-4 py-3 text-sm ${ok ? 'bg-green/10 text-green border border-green/20' : 'bg-red/10 text-red border border-red/20'}`}>
      {msg.text}
    </div>
  );
}

// ── Swap Tab ──────────────────────────────────────────────────────────────────
function SwapTab({ prices }) {
  const [from, setFrom]     = useState('USDT');
  const [to, setTo]         = useState('ETH');
  const [fromAmt, setFrom_] = useState('');
  const [toAmt, setToAmt]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [msg, setMsg]       = useState({ type:'', text:'' });

  const fromPrice = prices[from]?.price || 1;
  const toPrice   = prices[to]?.price   || 1;

  useEffect(() => {
    const n = parseFloat(fromAmt);
    setToAmt(isNaN(n) || n <= 0 ? '' : ((n * fromPrice / toPrice) * 0.997).toFixed(6));
  }, [fromAmt, from, to, fromPrice, toPrice]);

  const swap = async () => {
    if (!fromAmt || parseFloat(fromAmt) <= 0) return;
    setBusy(true); setMsg({ type:'', text:'' });
    try {
      await api.post('/wallet/swap', { fromCoin: from, toCoin: to, fromAmount: fromAmt });
      setMsg({ type:'success', text:`Swapped ${fromAmt} ${from} → ~${toAmt} ${to}` });
      setFrom_(''); setToAmt('');
    } catch (e) {
      setMsg({ type:'error', text: e.message || 'Swap failed' });
    } finally { setBusy(false); }
  };

  const flip = () => { const t=from; setFrom(to); setTo(t); setFrom_(''); };

  return (
    <div className="space-y-4">
      {/* From */}
      <div className="card p-4">
        <p className="text-xs text-textDim mb-2">You Pay</p>
        <div className="flex gap-3">
          <select value={from} onChange={e=>setFrom(e.target.value)}
            className="bg-surface2 border border-border rounded-xl px-3 py-2 text-white text-sm font-semibold w-28 cursor-pointer">
            {SEND_COINS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" value={fromAmt} onChange={e=>setFrom_(e.target.value)} placeholder="0.00"
            className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-2 text-white font-mono text-lg focus:border-primary outline-none" />
        </div>
        {fromAmt && <p className="text-xs text-textDim mt-1">≈ {formatUSD(parseFloat(fromAmt||0) * fromPrice)}</p>}
      </div>

      {/* Flip */}
      <div className="flex justify-center">
        <button onClick={flip}
          className="w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center text-primary hover:border-primary hover:scale-110 transition-all">
          ⇌
        </button>
      </div>

      {/* To */}
      <div className="card p-4">
        <p className="text-xs text-textDim mb-2">You Receive</p>
        <div className="flex gap-3">
          <select value={to} onChange={e=>setTo(e.target.value)}
            className="bg-surface2 border border-border rounded-xl px-3 py-2 text-white text-sm font-semibold w-28 cursor-pointer">
            {['ETH','BTC','SOL','BNB','USDT','USDC','TRX','TON'].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <input readOnly value={toAmt} placeholder="0.00"
            className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-2 text-white font-mono text-lg opacity-60" />
        </div>
      </div>

      {/* Rate info */}
      {fromAmt && !isNaN(fromAmt) && (
        <div className="text-xs text-textDim px-1 space-y-1">
          <div className="flex justify-between">
            <span>Rate</span>
            <span className="font-mono">1 {from} = {(fromPrice/toPrice).toFixed(6)} {to}</span>
          </div>
          <div className="flex justify-between">
            <span>Fee (0.3%)</span>
            <span className="font-mono text-gold">~{formatUSD(parseFloat(fromAmt)*fromPrice*0.003)}</span>
          </div>
        </div>
      )}

      <Toast msg={msg} />
      <p className="text-center text-xs text-textDim">Powered by 1inch · Demo mode</p>
      <button onClick={swap} disabled={!fromAmt||busy}
        className="btn-primary w-full py-4 font-semibold disabled:opacity-40">
        {busy ? 'Swapping…' : `Swap ${from} → ${to}`}
      </button>
    </div>
  );
}

// ── Main component (needs Suspense for useSearchParams) ───────────────────────
function WalletInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const tabMap       = { send:'Send', receive:'Receive', swap:'Swap', assets:'Assets' };

  const [activeTab, setTab]             = useState(tabMap[searchParams.get('tab')] || 'Assets');
  const [balances, setBalances]         = useState([]);
  const [prices, setPrices]             = useState({});
  const [user, setUser]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [sendTo, setSendTo]             = useState('');
  const [sendAmt, setSendAmt]           = useState('');
  const [sendCoin, setSendCoin]         = useState('USDT');
  const [sendNote, setSendNote]         = useState('');
  const [busy, setBusy]                 = useState(false);
  const [sendMsg, setSendMsg]           = useState({ type:'', text:'' });
  const [results, setResults]           = useState([]);
  const [addrCopied, setAddrCopied]     = useState(false);
  const [shareDone, setShareDone]       = useState(false);
  const [linkDone, setLinkDone]         = useState(false);
  const [network, setNetwork]           = useState('Ethereum');

  useEffect(() => {
    const u = localStorage.getItem('kryptox_user');
    if (!u) { router.push('/onboarding'); return; }
    setUser(JSON.parse(u));
    loadAll();
  }, []);

  const loadAll = async () => {
    const [bRes, pRes] = await Promise.allSettled([
      api.get('/wallet/balances'),
      api.get('/wallet/prices'),
    ]);
    if (bRes.status === 'fulfilled') setBalances(bRes.value.balances || []);
    if (pRes.status === 'fulfilled') setPrices(pRes.value || {});
    setLoading(false);
  };

  const searchUsers = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    try {
      const d = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults((d.users || []).slice(0, 5));
    } catch { setResults([]); }
  }, []);

  const handleSend = async () => {
    if (!sendTo || !sendAmt) return;
    setBusy(true); setSendMsg({ type:'', text:'' });
    try {
      await api.post('/wallet/send', {
        toUsername: sendTo, amount: parseFloat(sendAmt), currency: sendCoin, note: sendNote,
      });
      setSendMsg({ type:'success', text:`✓ Sent ${sendAmt} ${sendCoin} to @${sendTo}` });
      setSendTo(''); setSendAmt(''); setSendNote(''); setResults([]);
      loadAll();
    } catch (e) {
      setSendMsg({ type:'error', text: e.message || 'Send failed' });
    } finally { setBusy(false); }
  };

  const handleViralLink = async () => {
    if (!sendAmt) return;
    try {
      const d = await api.post('/wallet/viral-link', { amount:sendAmt, currency:sendCoin, note:sendNote });
      await navigator.clipboard.writeText(d.claimLink);
      setLinkDone(true);
      setTimeout(() => setLinkDone(false), 3000);
      loadAll();
    } catch (e) {
      setSendMsg({ type:'error', text: e.message || 'Failed to create link' });
    }
  };

  const handleShare = async () => {
    const url  = process.env.NEXT_PUBLIC_APP_URL || 'https://kryptox.app';
    const text = `Send me crypto on KRYPTOX!\n@${user?.username}\n${url}/u/${user?.username}`;
    if (navigator.share) { navigator.share({ text }).catch(()=>{}); }
    else { await navigator.clipboard.writeText(text); setShareDone(true); setTimeout(()=>setShareDone(false),2000); }
  };

  const address = user?.publicAddress || '0x0000000000000000000000000000000000000000';

  return (
    <MobileLayout>
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold mb-4">Wallet</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface2 p-1 rounded-2xl mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${activeTab===t ? 'bg-primary text-white' : 'text-textDim hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── ASSETS ── */}
        {activeTab === 'Assets' && (
          <div className="space-y-2">
            {loading ? [1,2,3,4,5].map(i => (
              <div key={i} className="card p-4 flex items-center gap-4">
                <Sk className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5"><Sk className="h-4 w-14" /><Sk className="h-3 w-20" /></div>
                <div className="space-y-1.5 text-right"><Sk className="h-4 w-16" /><Sk className="h-3 w-10" /></div>
              </div>
            )) : balances.map(coin => {
              const colors = getCoinColors(coin.symbol);
              return (
                <div key={coin.symbol} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colors.bg }}>
                    <img src={getCoinLogo(coin.symbol)} alt={coin.symbol} className="w-7 h-7 rounded-full"
                      onError={e=>{ e.currentTarget.style.display='none'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{coin.symbol}</div>
                    <div className="text-textDim text-xs font-mono">{formatAmount(coin.amount)} {coin.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold font-mono">{formatUSD(coin.usdValue)}</div>
                    <div className={`text-xs ${(coin.change24h||0)>=0?'text-green':'text-red'}`}>
                      {(coin.change24h||0)>=0?'+':''}{(coin.change24h||0).toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SEND ── */}
        {activeTab === 'Send' && (
          <div className="space-y-4">
            {/* Recipient */}
            <div className="relative">
              <input value={sendTo}
                onChange={e => { setSendTo(e.target.value); searchUsers(e.target.value); setSendMsg({type:'',text:''}); }}
                placeholder="@username"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3.5 text-white focus:border-primary outline-none" />
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded-xl mt-1 z-20 shadow-xl overflow-hidden">
                  {results.map(u => (
                    <button key={u.username}
                      onClick={() => { setSendTo(u.username); setResults([]); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface2 transition-colors text-left">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center font-bold text-xs text-white">
                        {u.username[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">@{u.username}</span>
                      {u.isVerified && <span className="text-blue-400 text-xs">✓</span>}
                      {u.isBusiness && <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded">BIZ</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount + coin */}
            <div className="flex gap-3">
              <input type="number" value={sendAmt}
                onChange={e => { setSendAmt(e.target.value); setSendMsg({type:'',text:''}); }}
                placeholder="0.00"
                className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3.5 text-white font-mono text-lg focus:border-primary outline-none" />
              <select value={sendCoin} onChange={e=>setSendCoin(e.target.value)}
                className="bg-surface2 border border-border rounded-xl px-3 py-3 text-white font-semibold w-28 cursor-pointer focus:border-primary outline-none">
                {SEND_COINS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>

            <input value={sendNote} onChange={e=>setSendNote(e.target.value)}
              placeholder="What's it for? (optional)"
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none" />

            <Toast msg={sendMsg} />

            <button onClick={handleSend} disabled={!sendTo||!sendAmt||busy}
              className="btn-primary w-full py-4 font-semibold disabled:opacity-40">
              {busy ? 'Sending…' : `Send ${sendAmt||'0'} ${sendCoin}`}
            </button>

            <button onClick={handleViralLink} disabled={!sendAmt}
              className="w-full border border-border rounded-xl py-3 text-sm text-textDim hover:border-primary/30 hover:text-white transition-all disabled:opacity-40">
              {linkDone ? '✓ Claim link copied!' : '📤 Create Claim Link (for non-users)'}
            </button>
          </div>
        )}

        {/* ── RECEIVE ── */}
        {activeTab === 'Receive' && (
          <div className="text-center space-y-5">
            <div>
              <p className="text-2xl font-bold">@{user?.username}</p>
              <p className="text-textDim text-sm mt-1">Share your username to receive payments</p>
            </div>

            <div className="text-left">
              <label className="text-xs text-textDim mb-2 block">Network</label>
              <select value={network} onChange={e=>setNetwork(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-white cursor-pointer focus:border-primary outline-none">
                {NETWORKS.map(n=><option key={n}>{n}</option>)}
              </select>
            </div>

            <QRGenerator value={address} size={192} className="mx-auto" />

            <div className="card p-4 text-left">
              <p className="text-xs text-textDim mb-1">{network} Address</p>
              <p className="font-mono text-sm text-white break-all">{shortenAddress(address, 8)}</p>
              <button
                onClick={async () => { await navigator.clipboard.writeText(address); setAddrCopied(true); setTimeout(()=>setAddrCopied(false),2000); }}
                className={`mt-3 text-xs px-4 py-2 rounded-xl border transition-colors ${addrCopied ? 'border-green text-green' : 'border-border text-textDim hover:text-white hover:border-primary/30'}`}>
                {addrCopied ? '✓ Copied!' : 'Copy Address'}
              </button>
            </div>

            <button onClick={handleShare}
              className={`w-full border rounded-xl py-3 text-sm transition-all ${shareDone ? 'border-green text-green' : 'border-border text-textDim hover:border-primary/30 hover:text-white'}`}>
              {shareDone ? '✓ Link copied!' : '📤 Share Profile Link'}
            </button>
          </div>
        )}

        {/* ── SWAP ── */}
        {activeTab === 'Swap' && <SwapTab prices={prices} />}
      </div>
    </MobileLayout>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WalletInner />
    </Suspense>
  );
}
