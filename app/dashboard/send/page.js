'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, CheckCircle, ExternalLink, Copy } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import { api } from '@/lib/api';
import { formatUSD, formatAmount, getCoinLogo } from '@/lib/wallet';
import { useToast } from '@/contexts/ToastContext';

const COINS = ['USDT','ETH','BTC','SOL','BNB','USDC','TRX','TON','XRP','DOGE'];

export default function SendPage() {
  const router = useRouter();
  const { success, error: toastErr } = useToast();

  const [step, setStep]       = useState(1);
  const [toUser, setToUser]   = useState('');
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState([]);
  const [amount, setAmount]   = useState('');
  const [coin, setCoin]       = useState('USDT');
  const [note, setNote]       = useState('');
  const [isUSD, setIsUSD]     = useState(false);
  const [busy, setBusy]       = useState(false);
  const [txHash, setTxHash]   = useState('');
  const [balances, setBals]   = useState({});
  const [prices, setPrices]   = useState({});
  const [user, setUser]       = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('kryptox_user') || '{}');
    setUser(u);
    Promise.all([api.get('/wallet/balances'), api.get('/wallet/prices')]).then(([b, p]) => {
      setBals(Object.fromEntries((b.balances||[]).map(x=>[x.symbol,x.amount])));
      setPrices(p);
    }).catch(()=>{});
  }, []);

  const searchUsers = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    try {
      const d = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(d.users || []);
    } catch { setResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const coinBal  = balances[coin] || 0;
  const coinPrice = prices[coin]?.price || 1;
  const numAmt   = parseFloat(amount) || 0;
  const usdValue = isUSD ? numAmt : numAmt * coinPrice;
  const coinAmt  = isUSD ? numAmt / coinPrice : numAmt;

  const handleSend = async () => {
    setBusy(true);
    try {
      const d = await api.post('/wallet/send', {
        toUsername: toUser, amount: coinAmt, currency: coin, note,
      });
      setTxHash(d.txHash || '0x' + Math.random().toString(16).slice(2));
      setStep(4);
      success(`Sent ${formatAmount(coinAmt)} ${coin} to @${toUser}`);
    } catch(e) { toastErr(e.message || 'Send failed'); }
    finally { setBusy(false); }
  };

  return (
    <MobileLayout title="Send" showBack>
      <div style={{ padding:'16px 16px 0' }}>

        {/* Step indicators */}
        <div style={{ display:'flex', gap:6, marginBottom:24 }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{
              flex:1, height:3, borderRadius:4,
              background: s <= step ? 'var(--accent-blue)' : 'var(--border)',
              transition:'background 300ms',
            }} />
          ))}
        </div>

        {/* ── Step 1: Recipient ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>Who are you sending to?</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>Search by @username or paste address</div>

            <div style={{ position:'relative', marginBottom:16 }}>
              <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search @username..." className="input" style={{ paddingLeft:42, fontSize:16 }} autoFocus />
              {search && <button onClick={()=>setSearch('')} style={{
                position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer',
              }}><X size={14} color="var(--text-muted)" /></button>}
            </div>

            {results.length > 0 && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', marginBottom:16 }}>
                {results.map((u, i) => (
                  <button key={u.username} onClick={() => { setToUser(u.username); setSearch(`@${u.username}`); setResults([]); setStep(2); }}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', gap:12,
                      padding:'14px 16px', background:'none', border:'none', cursor:'pointer',
                      borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                      transition:'background 150ms',
                    }}>
                    <div style={{
                      width:40, height:40, borderRadius:'50%', background:'var(--accent-gradient)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:700, fontSize:16, color:'#fff', flexShrink:0,
                    }}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontWeight:600, fontSize:14 }}>@{u.username}</div>
                      {u.isVerified && <div style={{ fontSize:11, color:'var(--accent-blue)' }}>✓ Verified</div>}
                    </div>
                    {u.isBusiness && <span style={{
                      marginLeft:'auto', fontSize:10, background:'rgba(255,159,67,0.15)',
                      color:'var(--accent-orange)', padding:'3px 8px', borderRadius:'var(--radius-full)', fontWeight:600,
                    }}>BIZ</span>}
                  </button>
                ))}
              </div>
            )}

            {toUser && (
              <button onClick={() => setStep(2)} className="btn-primary" style={{ width:'100%' }}>
                Continue to @{toUser} →
              </button>
            )}
          </div>
        )}

        {/* ── Step 2: Amount ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>How much?</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>Sending to @{toUser}</div>

            {/* Large amount input */}
            <div style={{ textAlign:'center', padding:'24px 0', marginBottom:16 }}>
              <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8 }}>{isUSD ? 'USD' : coin}</div>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                placeholder="0.00" style={{
                  background:'none', border:'none', outline:'none',
                  fontSize:48, fontWeight:800, color:'var(--text-primary)',
                  width:'100%', textAlign:'center', fontFamily:'var(--font-base)',
                }} />
              <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
                ≈ {isUSD ? `${formatAmount(coinAmt)} ${coin}` : formatUSD(usdValue)}
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                Balance: {formatAmount(coinBal)} {coin}
              </div>
            </div>

            {/* Coin selector */}
            <div style={{ display:'flex', gap:6, marginBottom:12, overflowX:'auto', paddingBottom:4 }}>
              {COINS.map(c => (
                <button key={c} onClick={()=>setCoin(c)} style={{
                  flexShrink:0, display:'flex', alignItems:'center', gap:6,
                  padding:'8px 12px', borderRadius:'var(--radius-full)',
                  background: coin===c ? 'var(--accent-gradient)' : 'var(--bg-card)',
                  border:`1px solid ${coin===c ? 'transparent' : 'var(--border)'}`,
                  color: coin===c ? '#fff' : 'var(--text-secondary)',
                  fontWeight:600, fontSize:12, cursor:'pointer',
                }}>
                  <img src={getCoinLogo(c)} width={16} height={16} style={{ borderRadius:'50%' }} alt={c} />
                  {c}
                </button>
              ))}
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              <button onClick={() => setAmount(String(coinBal))} style={{
                flex:1, padding:'10px', background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-md)', color:'var(--accent-blue)', fontWeight:600, fontSize:13, cursor:'pointer',
              }}>MAX</button>
              <button onClick={() => setIsUSD(p=>!p)} style={{
                flex:1, padding:'10px', background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-md)', color:'var(--text-secondary)', fontWeight:600, fontSize:13, cursor:'pointer',
              }}>Switch to {isUSD ? coin : 'USD'}</button>
            </div>

            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note (optional)"
              className="input" style={{ marginBottom:16, fontSize:16 }} />

            {numAmt > coinBal && (
              <div style={{ background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.3)',
                borderRadius:'var(--radius-md)', padding:'10px 14px', fontSize:13, color:'var(--accent-red)', marginBottom:12 }}>
                ⚠️ Insufficient {coin} balance
              </div>
            )}

            {numAmt > coinBal * 0.5 && numAmt <= coinBal && (
              <div style={{ background:'rgba(255,159,67,0.1)', border:'1px solid rgba(255,159,67,0.3)',
                borderRadius:'var(--radius-md)', padding:'10px 14px', fontSize:13, color:'var(--accent-orange)', marginBottom:12 }}>
                ⚠️ You're sending more than 50% of your balance
              </div>
            )}

            <button onClick={() => setStep(3)} disabled={!amount || numAmt <= 0 || numAmt > coinBal}
              className="btn-primary" style={{ width:'100%' }}>
              Review Transaction →
            </button>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>Review & Confirm</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Double-check before sending</div>

            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
              {[
                ['To', `@${toUser}`],
                ['Amount', `${formatAmount(coinAmt)} ${coin}`],
                ['USD Value', formatUSD(usdValue)],
                ['Network Fee', '~$0.00 (Demo)'],
                ...(note ? [['Note', note]] : []),
              ].map(([l,v]) => (
                <div key={l} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'14px 16px', background:'var(--bg-card)', border:'1px solid var(--border)',
                  borderRadius:'var(--radius-md)',
                }}>
                  <span style={{ fontSize:13, color:'var(--text-muted)' }}>{l}</span>
                  <span style={{ fontSize:14, fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>

            <button onClick={handleSend} disabled={busy} className="btn-primary" style={{ width:'100%', marginBottom:10 }}>
              {busy ? 'Sending…' : `Confirm Send ${formatAmount(coinAmt)} ${coin}`}
            </button>
            <button onClick={() => setStep(2)} className="btn-ghost" style={{ width:'100%' }}>← Edit</button>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && (
          <div style={{ textAlign:'center', paddingTop:32 }}>
            <div style={{
              width:80, height:80, borderRadius:'50%', background:'rgba(0,214,143,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px',
            }}>
              <CheckCircle size={40} color="var(--accent-green)" />
            </div>
            <div style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>Sent!</div>
            <div style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:4 }}>
              {formatAmount(coinAmt)} {coin} to @{toUser}
            </div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>
              {formatUSD(usdValue)} · Just now
            </div>

            {txHash && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-md)', padding:'12px 16px', marginBottom:24, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-muted)', flex:1, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {txHash}
                </span>
                <button onClick={() => { navigator.clipboard.writeText(txHash); success('Hash copied!'); }}
                  style={{ background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
                  <Copy size={14} color="var(--text-muted)" />
                </button>
              </div>
            )}

            <button onClick={() => router.push('/dashboard/home')} className="btn-primary" style={{ width:'100%', marginBottom:10 }}>
              Done
            </button>
            <button onClick={() => { setStep(1); setAmount(''); setToUser(''); setSearch(''); setTxHash(''); }}
              className="btn-ghost" style={{ width:'100%' }}>
              Send Another
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
