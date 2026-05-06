'use client';
import { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, Settings, ChevronDown, CheckCircle } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import { api } from '@/lib/api';
import { formatUSD, formatAmount, getCoinLogo } from '@/lib/wallet';
import { useToast } from '@/contexts/ToastContext';

const COINS = ['USDT','ETH','BTC','SOL','BNB','USDC','TRX','TON','XRP','DOGE','AVAX','MATIC','LTC','LINK','ADA'];
const SLIPPAGE_OPTIONS = ['Auto','0.5%','1%','2%'];

function CoinSelector({ value, onChange, balances }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = COINS.filter(c => c.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
        background:'var(--bg-card-hover)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-full)', cursor:'pointer', flexShrink:0,
      }}>
        <img src={getCoinLogo(value)} width={20} height={20} style={{ borderRadius:'50%' }} alt={value} />
        <span style={{ fontWeight:700, fontSize:14 }}>{value}</span>
        <ChevronDown size={12} color="var(--text-muted)" />
      </button>

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet" style={{ maxHeight:'80vh' }} onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ fontWeight:700, fontSize:17, marginBottom:12 }}>Select Token</div>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search..." className="input" style={{ marginBottom:12, fontSize:16 }} />
            <div style={{ overflowY:'auto', maxHeight:320, display:'flex', flexDirection:'column', gap:4 }}>
              {filtered.map(c => (
                <button key={c} onClick={() => { onChange(c); setOpen(false); setQ(''); }}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                    background: c===value ? 'rgba(79,142,247,0.1)' : 'transparent',
                    border:`1px solid ${c===value ? 'var(--border-active)' : 'transparent'}`,
                    borderRadius:'var(--radius-md)', cursor:'pointer',
                  }}>
                  <img src={getCoinLogo(c)} width={36} height={36} style={{ borderRadius:'50%' }} alt={c} />
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{c}</div>
                    {balances[c] && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Balance: {formatAmount(balances[c])}</div>}
                  </div>
                  {c === value && <CheckCircle size={16} color="var(--accent-blue)" style={{ marginLeft:'auto' }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SwapPage() {
  const { success, error: toastErr } = useToast();
  const [from, setFrom] = useState('USDT');
  const [to, setTo]     = useState('ETH');
  const [fromAmt, setFromAmt] = useState('');
  const [toAmt, setToAmt]     = useState('');
  const [prices, setPrices]   = useState({});
  const [balances, setBals]   = useState({});
  const [slippage, setSlip]   = useState('Auto');
  const [showSlip, setShowSlip] = useState(false);
  const [busy, setBusy]       = useState(false);
  const [done, setDone]       = useState(false);

  useEffect(() => {
    Promise.all([api.get('/wallet/prices'), api.get('/wallet/balances')]).then(([p,b]) => {
      setPrices(p);
      setBals(Object.fromEntries((b.balances||[]).map(x=>[x.symbol,x.amount])));
    }).catch(()=>{});
  }, []);

  const fromPrice = prices[from]?.price || 1;
  const toPrice   = prices[to]?.price   || 1;
  const rate      = fromPrice / toPrice;

  useEffect(() => {
    const n = parseFloat(fromAmt);
    if (!isNaN(n) && n > 0) {
      setToAmt(((n * rate) * 0.997).toFixed(6));
    } else setToAmt('');
  }, [fromAmt, from, to, rate]);

  const flip = () => {
    const tf = from; setFrom(to); setTo(tf);
    setFromAmt(''); setToAmt('');
  };

  const handleSwap = async () => {
    if (!fromAmt || parseFloat(fromAmt) <= 0) return;
    setBusy(true);
    try {
      await api.post('/wallet/swap', { fromCoin:from, toCoin:to, fromAmount:fromAmt });
      setDone(true);
      success(`Swapped ${fromAmt} ${from} → ~${toAmt} ${to}`);
    } catch(e) { toastErr(e.message || 'Swap failed'); }
    finally { setBusy(false); }
  };

  const numAmt  = parseFloat(fromAmt) || 0;
  const bal     = balances[from] || 0;
  const insuf   = numAmt > bal;
  const impact  = numAmt > 0 ? ((numAmt * fromPrice) / 1000000 * 100).toFixed(2) : '0.00';

  if (done) return (
    <MobileLayout title="Swap" showBack>
      <div style={{ padding:'48px 16px', textAlign:'center' }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(0,214,143,0.15)',
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <CheckCircle size={40} color="var(--accent-green)" />
        </div>
        <div style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>Swap Complete!</div>
        <div style={{ fontSize:15, color:'var(--text-secondary)' }}>
          {fromAmt} {from} → ~{toAmt} {to}
        </div>
        <button onClick={() => { setDone(false); setFromAmt(''); setToAmt(''); }}
          className="btn-primary" style={{ width:'100%', marginTop:32 }}>Swap Again</button>
      </div>
    </MobileLayout>
  );

  return (
    <MobileLayout title="Swap" showBack rightAction={
      <button onClick={() => setShowSlip(true)} style={{ width:36, height:36, borderRadius:'var(--radius-md)',
        background:'var(--bg-card)', border:'1px solid var(--border)', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Settings size={16} color="var(--text-secondary)" />
      </button>
    }>
      <div style={{ padding:'16px' }}>

        {/* From */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:'var(--radius-lg)', padding:16, marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>You Pay</span>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>Balance: {formatAmount(bal)} {from}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <CoinSelector value={from} onChange={setFrom} balances={balances} />
            <input type="number" value={fromAmt} onChange={e=>setFromAmt(e.target.value)}
              placeholder="0.00" style={{
                flex:1, background:'none', border:'none', outline:'none',
                fontSize:28, fontWeight:800, color:'var(--text-primary)',
                fontFamily:'var(--font-base)', textAlign:'right', minWidth:0,
              }} />
          </div>
          {fromAmt && <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'right', marginTop:4 }}>
            ≈ {formatUSD(numAmt * fromPrice)}
          </div>}
          <button onClick={() => setFromAmt(String(bal))} style={{
            marginTop:8, padding:'4px 10px', background:'rgba(79,142,247,0.1)',
            border:'1px solid rgba(79,142,247,0.2)', borderRadius:'var(--radius-full)',
            color:'var(--accent-blue)', fontSize:11, fontWeight:700, cursor:'pointer',
          }}>MAX</button>
        </div>

        {/* Flip */}
        <div style={{ display:'flex', justifyContent:'center', margin:'4px 0' }}>
          <button onClick={flip} style={{
            width:40, height:40, borderRadius:'50%', background:'var(--bg-card)',
            border:'1px solid var(--border)', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'transform 300ms',
          }}>
            <ArrowUpDown size={18} color="var(--accent-blue)" />
          </button>
        </div>

        {/* To */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:'var(--radius-lg)', padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>You Receive</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <CoinSelector value={to} onChange={setTo} balances={balances} />
            <div style={{ flex:1, fontSize:28, fontWeight:800, color: toAmt ? 'var(--text-primary)' : 'var(--text-muted)',
              textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
              {toAmt || '0.00'}
            </div>
          </div>
          {toAmt && <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'right', marginTop:4 }}>
            ≈ {formatUSD(parseFloat(toAmt||0) * toPrice)}
          </div>}
        </div>

        {/* Rate info */}
        {fromAmt && (
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-md)', padding:'10px 14px', marginBottom:16 }}>
            {[
              ['Rate', `1 ${from} = ${rate.toFixed(6)} ${to}`],
              ['Price Impact', `~${impact}%`],
              ['Network Fee', '~$0.00 (Demo)'],
              ['Slippage', slippage],
            ].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:12 }}>
                <span style={{ color:'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {insuf && (
          <div style={{ background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.3)',
            borderRadius:'var(--radius-md)', padding:'10px 14px', fontSize:13, color:'var(--accent-red)', marginBottom:12 }}>
            Insufficient {from} balance
          </div>
        )}

        <button onClick={handleSwap}
          disabled={!fromAmt || parseFloat(fromAmt)<=0 || insuf || busy || from===to}
          className="btn-primary" style={{ width:'100%', fontSize:16 }}>
          {busy ? 'Swapping…' : !fromAmt ? 'Enter amount'
            : insuf ? `Insufficient ${from}`
            : from===to ? 'Select different coins'
            : `Swap ${from} → ${to}`}
        </button>

        <p style={{ textAlign:'center', fontSize:11, color:'var(--text-muted)', marginTop:10 }}>
          Powered by 1inch · Demo mode
        </p>
      </div>

      {/* Slippage sheet */}
      {showSlip && (
        <div className="sheet-backdrop" onClick={() => setShowSlip(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ fontWeight:700, fontSize:17, marginBottom:16 }}>Slippage Tolerance</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
              {SLIPPAGE_OPTIONS.map(s => (
                <button key={s} onClick={() => { setSlip(s); setShowSlip(false); }}
                  style={{
                    padding:'12px 8px', borderRadius:'var(--radius-md)', fontWeight:700, fontSize:13, cursor:'pointer',
                    background: slippage===s ? 'var(--accent-gradient)' : 'var(--bg-card)',
                    border:`1px solid ${slippage===s ? 'transparent' : 'var(--border)'}`,
                    color: slippage===s ? '#fff' : 'var(--text-secondary)',
                  }}>{s}</button>
              ))}
            </div>
            {(slippage==='2%') && (
              <div style={{ fontSize:12, color:'var(--accent-orange)', background:'rgba(255,159,67,0.1)',
                borderRadius:'var(--radius-md)', padding:'10px 14px' }}>
                ⚠️ High slippage — you may get a worse rate
              </div>
            )}
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
