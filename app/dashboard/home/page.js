'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ScanLine, ArrowUpRight, ArrowDownLeft, RefreshCw, ShoppingCart } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import { api } from '@/lib/api';
import { formatUSD, formatAmount, getCoinLogo } from '@/lib/wallet';

function Sk({ w = '100%', h = 16, r = 8, style = {} }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

function Sparkline({ data, positive }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const W = 100, H = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / ((max - min) || 1)) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = positive ? '#00D68F' : '#FF4D6A';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

const QUICK_ACTIONS = [
  { label: 'Send',    icon: ArrowUpRight,  path: '/dashboard/send',    color: '#4F8EF7' },
  { label: 'Receive', icon: ArrowDownLeft, path: '/dashboard/receive',  color: '#00D68F' },
  { label: 'Swap',    icon: RefreshCw,     path: '/dashboard/wallet/swap', color: '#FF9F43' },
  { label: 'Buy',     icon: ShoppingCart,  path: '/dashboard/wallet',   color: '#7C5CFC' },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [balances, setBalances] = useState([]);
  const [totalUSD, setTotal]    = useState(0);
  const [change24h, setChange]  = useState({ pct: 0, value: 0 });
  const [transactions, setTxs]  = useState([]);
  const [loading, setLoading]   = useState(true);
  const [spark] = useState(() => Array.from({length:12},(_,i)=>90+i*3+(Math.random()-0.5)*8));

  useEffect(() => {
    const u = localStorage.getItem('kryptox_user');
    if (!u) { router.replace('/onboarding'); return; }
    setUser(JSON.parse(u));
    load();
  }, []);

  const load = async () => {
    const [bRes, tRes] = await Promise.allSettled([
      api.get('/wallet/balances'),
      api.get('/wallet/transactions?limit=5'),
    ]);
    if (bRes.status === 'fulfilled') {
      const bals = bRes.value.balances || [];
      const total = bRes.value.totalUSD || 0;
      setBalances(bals);
      setTotal(total);
      const wc = bals.reduce((a,b) => a + (b.change24h||0)*b.usdValue, 0);
      const pct = total > 0 ? wc/total : 0;
      setChange({ pct, value: total*(pct/100) });
    }
    if (tRes.status === 'fulfilled') setTxs(tRes.value.transactions || []);
    setLoading(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const pos = change24h.pct >= 0;

  return (
    <MobileLayout>
      <div style={{ fontFamily:'var(--font-base)' }}>
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 16px', paddingTop:'max(52px, calc(44px + env(safe-area-inset-top)))', paddingBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:40, height:40, borderRadius:'50%',
            background:'var(--accent-gradient)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:700, fontSize:16, color:'#fff',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'K'}
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500 }}>{greeting()}</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>@{user?.username}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => router.push('/dashboard/profile')} style={{
            width:40, height:40, borderRadius:'var(--radius-md)',
            background:'var(--bg-card)', border:'1px solid var(--border)',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Bell size={18} color="var(--text-secondary)" />
          </button>
          <button onClick={() => router.push('/dashboard/receive')} style={{
            width:40, height:40, borderRadius:'var(--radius-md)',
            background:'var(--bg-card)', border:'1px solid var(--border)',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <ScanLine size={18} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      <div style={{ padding:'0 16px', paddingBottom:'calc(80px + env(safe-area-inset-bottom))' }}>

        {/* ── Portfolio Card ── */}
        <div className="gradient-border" style={{ marginBottom:16 }}>
          <div style={{
            background:'var(--bg-card)', borderRadius:'var(--radius-lg)',
            padding:20, overflow:'hidden', position:'relative',
          }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(79,142,247,0.12), transparent 70%)' }} />
            <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:500, marginBottom:4 }}>Total Portfolio</div>
            {loading ? (
              <>
                <Sk w="60%" h={36} r={8} style={{marginBottom:8}} />
                <Sk w="40%" h={16} r={6} style={{marginBottom:16}} />
                <Sk w={100} h={32} r={4} />
              </>
            ) : (
              <>
                <div style={{ fontSize:32, fontWeight:800, color:'var(--text-primary)', marginBottom:4, fontVariantNumeric:'tabular-nums' }}>
                  {formatUSD(totalUSD)}
                </div>
                <div style={{ fontSize:13, fontWeight:600, color: pos ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom:16 }}>
                  {pos ? '+' : ''}{formatUSD(change24h.value)} ({pos ? '+' : ''}{change24h.pct.toFixed(2)}%) today
                </div>
                <Sparkline data={spark} positive={pos} />
              </>
            )}

            {/* Quick actions */}
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              {QUICK_ACTIONS.map(a => {
                const Icon = a.icon;
                return (
                  <button key={a.label} onClick={() => router.push(a.path)} style={{
                    flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)',
                    borderRadius:'var(--radius-md)', padding:'10px 4px', cursor:'pointer',
                    transition:'background 150ms',
                  }}>
                    <div style={{
                      width:32, height:32, borderRadius:'50%',
                      background: a.color + '20',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Icon size={15} color={a.color} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize:10, color:'var(--text-secondary)', fontWeight:500 }}>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Assets ── */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Your Assets</span>
            <button onClick={() => router.push('/dashboard/wallet')} style={{
              background:'none', border:'none', color:'var(--accent-blue)', fontSize:13, fontWeight:600, cursor:'pointer',
            }}>Manage</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {loading ? [1,2,3,4,5].map(i => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'var(--bg-card)',
                borderRadius:'var(--radius-lg)', padding:'12px 14px', border:'1px solid var(--border)' }}>
                <Sk w={40} h={40} r={20} />
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                  <Sk w="40%" h={13} />
                  <Sk w="60%" h={11} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                  <Sk w={60} h={13} />
                  <Sk w={40} h={11} />
                </div>
              </div>
            )) : balances.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 16px', color:'var(--text-muted)' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>💼</div>
                <div style={{ fontWeight:600, marginBottom:4 }}>No assets yet</div>
                <div style={{ fontSize:13 }}>Add crypto to get started</div>
              </div>
            ) : balances.slice(0,6).map(coin => {
              const cpct = coin.change24h || 0;
              return (
                <button key={coin.symbol} onClick={() => router.push(`/dashboard/wallet/${coin.symbol.toLowerCase()}`)}
                  style={{
                    display:'flex', alignItems:'center', gap:12,
                    background:'var(--bg-card)', borderRadius:'var(--radius-lg)',
                    padding:'12px 14px', border:'1px solid var(--border)',
                    cursor:'pointer', transition:'background 150ms', width:'100%', textAlign:'left',
                  }}>
                  <img src={getCoinLogo(coin.symbol)} alt={coin.symbol} width={40} height={40}
                    style={{ borderRadius:'50%', flexShrink:0 }}
                    onError={e => { e.currentTarget.src = `https://via.placeholder.com/40/4F8EF7/ffffff?text=${coin.symbol[0]}`; }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{coin.symbol}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>
                      {formatAmount(coin.amount)} {coin.symbol}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, fontVariantNumeric:'tabular-nums' }}>{formatUSD(coin.usdValue)}</div>
                    <div style={{ fontSize:11, fontWeight:600, color: cpct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {cpct >= 0 ? '+' : ''}{cpct.toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Recent Activity</span>
            <button onClick={() => router.push('/dashboard/chat')} style={{
              background:'none', border:'none', color:'var(--accent-blue)', fontSize:13, fontWeight:600, cursor:'pointer',
            }}>View All</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {loading ? [1,2,3].map(i => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'var(--bg-card)',
                borderRadius:'var(--radius-lg)', padding:'12px 14px', border:'1px solid var(--border)' }}>
                <Sk w={36} h={36} r={18} />
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                  <Sk w="50%" h={13} />
                  <Sk w="35%" h={11} />
                </div>
                <Sk w={60} h={13} />
              </div>
            )) : transactions.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 16px', color:'var(--text-muted)' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
                <div style={{ fontWeight:600, marginBottom:4 }}>No transactions yet</div>
                <div style={{ fontSize:13 }}>Send your first payment to get started</div>
              </div>
            ) : transactions.map(tx => {
              const isSent = tx.fromUsername === user?.username;
              const partner = isSent ? tx.toUsername : tx.fromUsername;
              const diffMs = Date.now() - new Date(tx.createdAt).getTime();
              const mins = Math.floor(diffMs/60000);
              const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins/60)}h ago` : `${Math.floor(mins/1440)}d ago`;
              return (
                <div key={tx.id} style={{
                  display:'flex', alignItems:'center', gap:12,
                  background:'var(--bg-card)', borderRadius:'var(--radius-lg)',
                  padding:'12px 14px', border:'1px solid var(--border)',
                }}>
                  <div style={{
                    width:36, height:36, borderRadius:'50%', flexShrink:0,
                    background: isSent ? 'rgba(79,142,247,0.15)' : 'rgba(0,214,143,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {isSent
                      ? <ArrowUpRight size={16} color="var(--accent-blue)" />
                      : <ArrowDownLeft size={16} color="var(--accent-green)" />
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{isSent ? 'Sent to' : 'From'} @{partner}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{timeAgo}</div>
                  </div>
                  <div style={{
                    fontWeight:700, fontSize:13, fontVariantNumeric:'tabular-nums',
                    color: isSent ? 'var(--accent-red)' : 'var(--accent-green)',
                  }}>
                    {isSent ? '-' : '+'}{formatAmount(tx.amount)} {tx.currency}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      </div>
    </MobileLayout>
  );
}
