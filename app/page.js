'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ─── Real CoinGecko logos ─────────────────────────────────────────────────────
const LOGOS = {
  BTC:   'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:   'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDT:  'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  USDC:  'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  BNB:   'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  SOL:   'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  TRX:   'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  TON:   'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
  XRP:   'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  DOGE:  'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  AVAX:  'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  LTC:   'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  LINK:  'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  ADA:   'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOT:   'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  UNI:   'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  ATOM:  'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
  DAI:   'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
};

const COIN_PRICES = { BTC:'$67,204',ETH:'$3,512',USDT:'$1.00',SOL:'$148',BNB:'$583' };
const COIN_CHANGE = { BTC:'+2.4%',ETH:'+1.8%',USDT:'+0.01%',SOL:'+4.1%',BNB:'-0.9%' };
const COIN_POS =    { BTC:true,   ETH:true,    USDT:true,    SOL:true,   BNB:false  };

const PHONE_COINS = [
  { sym:'ETH',  amt:'0.542',    usd:'$2,083' },
  { sym:'USDT', amt:'2,450.00', usd:'$2,450' },
  { sym:'BTC',  amt:'0.008',    usd:'$539'   },
  { sym:'SOL',  amt:'12.5',     usd:'$2,320' },
];

const FEATURES = [
  {
    emoji:'⚡',
    tag:'Instant',
    title:'Send by @username',
    desc:'Forget copying wallet addresses. Just type @username — your contact, your colleague, a stranger on the other side of the world. Hit send. Done in under 2 seconds.',
    sub:['No address errors','Works across all chains','Contacts auto-suggest'],
    accent:'#9B7EC8',
    bg:'rgba(123,94,167,0.08)',
  },
  {
    emoji:'💬',
    tag:'Unified',
    title:'Chat + Pay in One Thread',
    desc:'Money and conversation belong together. Send a payment inside a message. Request funds with one tap. See receipts inline. No app-switching, no friction, no confusion.',
    sub:['Real-time delivery','Payment requests','Read receipts on money'],
    accent:'#00D97E',
    bg:'rgba(0,217,126,0.08)',
  },
  {
    emoji:'🏪',
    tag:'Business',
    title:'Professional Crypto Invoicing',
    desc:'Create a branded invoice in 10 seconds. Share the link via WhatsApp, email, or QR code. Your customer pays in any coin. You get notified the second money arrives.',
    sub:['Custom descriptions','Countdown timers','Auto-expire protection'],
    accent:'#F0B429',
    bg:'rgba(240,180,41,0.08)',
  },
  {
    emoji:'📈',
    tag:'DeFi',
    title:'Stake & Earn Passively',
    desc:'Your idle crypto should work for you. Stake ETH, SOL, BNB, or ADA and earn real yield — compounded daily, visible in real time. Withdraw any time, zero lockups on most assets.',
    sub:['Up to 6.5% APY','Daily compounding','Flexible withdrawal'],
    accent:'#4A90D9',
    bg:'rgba(74,144,217,0.08)',
  },
  {
    emoji:'🔗',
    tag:'Viral',
    title:'Send to Anyone, No Account Needed',
    desc:'Reach people who aren\'t on crypto yet. Create a claim link — it holds the funds — share it anywhere. They join KRYPTOX, claim instantly. Best onboarding tool ever built.',
    sub:['Funds held in escrow','Auto-refund if unclaimed','Works via any link'],
    accent:'#A78BFA',
    bg:'rgba(167,139,250,0.08)',
  },
  {
    emoji:'🏆',
    tag:'Identity',
    title:'Own Your @Username Forever',
    desc:'Premium handles like @pay, @gold, @ai are going once. Bid with USDT in real-time auctions. Win and that username is yours on-chain — permanently, globally, unforgeable.',
    sub:['On-chain ownership','Live bidding','Auto-refund on loss'],
    accent:'#FB923C',
    bg:'rgba(251,146,60,0.08)',
  },
  {
    emoji:'🔄',
    tag:'Trading',
    title:'Swap 19 Coins Instantly',
    desc:'Exchange crypto at market rates inside the app. No CEX account. No verification. No waiting. Powered by 1inch aggregator for best-in-market routing and minimal slippage.',
    sub:['0.3% flat fee','Best-rate routing','19 coins supported'],
    accent:'#34D399',
    bg:'rgba(52,211,153,0.08)',
  },
  {
    emoji:'🌍',
    tag:'Global',
    title:'190+ Countries. 16 Languages.',
    desc:'Built for the world — from Tashkent to Tokyo, Lagos to London. No bank account required. No government ID. Just a username and a phone. Financial freedom for 1.4B unbanked people.',
    sub:['No KYC required','16 UI languages','Works on any phone'],
    accent:'#60A5FA',
    bg:'rgba(96,165,250,0.08)',
  },
];

const HOW_IT_WORKS = [
  { step:'01', title:'Claim your @username', desc:'Pick any available @handle. It\'s yours across the entire KRYPTOX network — your address, your identity, forever.' },
  { step:'02', title:'Get your seed phrase', desc:'12 words. Write them down. Your keys, your coins. We never see your private key — true non-custodial ownership.' },
  { step:'03', title:'Send, receive, earn', desc:'Top up, start sending, or connect with businesses. Your full DeFi command center in one dark-mode app.' },
];

const COMPARE = [
  { feature:'Send to @username',  kryptox:true,  bank:false, other:false },
  { feature:'No KYC required',    kryptox:true,  bank:false, other:false },
  { feature:'Built-in chat',      kryptox:true,  bank:false, other:false },
  { feature:'Staking rewards',    kryptox:true,  bank:false, other:true  },
  { feature:'Crypto invoicing',   kryptox:true,  bank:false, other:false },
  { feature:'19 coins',           kryptox:true,  bank:false, other:true  },
  { feature:'Zero transfer fees', kryptox:true,  bank:false, other:false },
  { feature:'Claim links',        kryptox:true,  bank:false, other:false },
];

const TESTIMONIALS = [
  { name:'@davo_uzb',    flag:'🇺🇿', text:'Sent $500 to my brother in Germany in 2 seconds. No bank, no fees, no drama. This is what money should feel like.' },
  { name:'@techshop_uz', flag:'🏪', text:'We replaced our entire payment terminal with KRYPTOX invoices. Customers love it. Settlement is instant.' },
  { name:'@crypto_kg',   flag:'🇰🇬', text:'The claim link feature is genius. Sent SOL to my friend who had zero crypto experience. He claimed it in under a minute.' },
  { name:'@sara_ka',     flag:'🇸🇦', text:'Finally a wallet that doesn\'t require a PhD to use. @username payments changed my life — literally.' },
];

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 1600) {
  const [val, setVal] = useState(0);
  const [go, setGo] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setGo(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!go) return;
    const n = parseInt(String(target).replace(/\D/g, ''), 10);
    if (!n) { setVal(target); return; }
    let frame = 0;
    const total = 50;
    const t = setInterval(() => {
      frame++;
      setVal(Math.floor((1 - Math.pow(1 - frame / total, 3)) * n));
      if (frame >= total) { setVal(n); clearInterval(t); }
    }, duration / total);
    return () => clearInterval(t);
  }, [go, target, duration]);
  return { val, ref };
}

// ─── Ticker row of coin logos ─────────────────────────────────────────────────
function CoinTicker() {
  const coins = Object.entries(LOGOS);
  const doubled = [...coins, ...coins];
  return (
    <div className="overflow-hidden relative py-2">
      <div className="flex gap-6 animate-[ticker_30s_linear_infinite]" style={{ width: 'max-content' }}>
        {doubled.map(([sym, url], i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
            <img src={url} alt={sym} width={20} height={20} className="rounded-full" />
            <span className="text-xs font-bold text-white/70">{sym}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#080810] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#080810] to-transparent pointer-events-none z-10" />
    </div>
  );
}

// ─── Phone mockup ─────────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px]">
      {/* Glow under phone */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-10 rounded-full blur-2xl"
        style={{ background: 'rgba(123,94,167,0.5)' }} />
      {/* Phone shell */}
      <div className="relative rounded-[42px] p-[3px]"
        style={{ background: 'linear-gradient(145deg, #3A3A5C, #1A1A2E)' }}>
        <div className="rounded-[40px] overflow-hidden bg-[#0D0D15]">
          {/* Status bar */}
          <div className="flex justify-between items-center px-6 pt-3 pb-1">
            <span className="text-[10px] font-mono text-white/50">9:41</span>
            <div className="w-20 h-4 rounded-full bg-black flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/10" />
            </div>
            <span className="text-[10px] text-white/50">●●●</span>
          </div>
          {/* Content */}
          <div className="px-5 pt-2 pb-4">
            <div className="text-[11px] text-white/40 mb-0.5">Hey @aziz 👋</div>
            <div className="text-[28px] font-black tracking-tight font-mono leading-none mb-0.5">$7,392</div>
            <div className="text-[11px] font-semibold mb-4" style={{ color: '#00D97E' }}>+$128 (+1.8%) ↑</div>
            <div className="space-y-2.5">
              {PHONE_COINS.map(c => (
                <div key={c.sym} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={LOGOS[c.sym]} alt={c.sym} width={26} height={26} className="rounded-full" />
                    <div>
                      <div className="text-[12px] font-bold">{c.sym}</div>
                      <div className="text-[9px] font-mono" style={{ color: '#8888AA' }}>{c.amt}</div>
                    </div>
                  </div>
                  <div className="text-[12px] font-bold font-mono">{c.usd}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Bottom nav */}
          <div className="flex justify-around py-3 px-4 border-t border-white/[0.06]">
            {[
              <svg key="h" width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M2 6.5L8 2l6 4.5V14H10v-3H6v3H2V6.5z" stroke="#7B5EA7" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
              <svg key="c" width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M2 3h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" stroke="#8888AA" strokeWidth="1.5"/><path d="M5 7h6M5 9.5h3" stroke="#8888AA" strokeWidth="1.2" strokeLinecap="round"/></svg>,
              <svg key="w" width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="#8888AA" strokeWidth="1.5"/><circle cx="11" cy="8.5" r="1.5" fill="#8888AA"/></svg>,
              <svg key="e" width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M8 2v4M2 8h4M14 8h-4M8 14v-4" stroke="#8888AA" strokeWidth="1.5" strokeLinecap="round"/></svg>,
              <svg key="d" width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="7" cy="7" r="4" stroke="#8888AA" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="#8888AA" strokeWidth="1.5" strokeLinecap="round"/></svg>,
            ]}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [navSolid, setNavSolid] = useState(false);
  const [activeFeat, setActiveFeat] = useState(0);
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 600], [0, -100]);

  useEffect(() => {
    const u = scrollY.on('change', v => setNavSolid(v > 40));
    const t = setInterval(() => setActiveFeat(p => (p + 1) % FEATURES.length), 3500);
    return () => { u(); clearInterval(t); };
  }, []);

  const s1 = useCounter(190);
  const s2 = useCounter(2);
  const s3 = useCounter(19);
  const s4 = useCounter(50000);

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#080810', fontFamily: 'Inter, sans-serif' }}>

      {/* Keyframe for ticker */}
      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeSlideUp 0.7s ease forwards; }
        .delay-1 { animation-delay: 0.15s; opacity: 0; }
        .delay-2 { animation-delay: 0.3s;  opacity: 0; }
        .delay-3 { animation-delay: 0.45s; opacity: 0; }
        .delay-4 { animation-delay: 0.6s;  opacity: 0; }
      `}</style>

      {/* ── Ambient glows ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div style={{ y: heroParallax }}>
          <div className="absolute top-[-200px] left-[-100px] w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(123,94,167,0.25) 0%, transparent 65%)', filter: 'blur(60px)' }} />
          <div className="absolute top-[30%] right-[-150px] w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(74,144,217,0.18) 0%, transparent 65%)', filter: 'blur(80px)' }} />
          <div className="absolute bottom-[5%] left-[30%] w-[450px] h-[450px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(240,180,41,0.12) 0%, transparent 65%)', filter: 'blur(100px)' }} />
        </motion.div>
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navSolid ? 'bg-[#080810]/90 backdrop-blur-xl border-b border-white/[0.06]' : ''}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-base text-white"
              style={{ background: 'linear-gradient(135deg, #7B5EA7, #4A90D9)' }}>K</div>
            <span className="text-lg font-black tracking-tight gradient-text">KRYPTOX</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[['Features','#features'],['How it works','#how'],['Pricing','#pricing'],['Auctions','/auction']].map(([l,h]) => (
              <a key={l} href={h} className="text-sm font-medium text-white/50 hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/onboarding?mode=login"
              className="hidden sm:block text-sm font-medium text-white/60 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/onboarding"
              className="text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, #7B5EA7, #4A90D9)' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">

        {/* Demo badge */}
        <div className="fade-up inline-flex items-center gap-2.5 rounded-full px-5 py-2 mb-8 text-sm border"
          style={{ background: 'rgba(0,217,126,0.08)', borderColor: 'rgba(0,217,126,0.2)' }}>
          <span className="w-2 h-2 rounded-full bg-green animate-pulse flex-shrink-0" style={{ background: '#00D97E' }} />
          <span className="font-semibold" style={{ color: '#00D97E' }}>Live Demo — No real money required</span>
        </div>

        {/* Headline */}
        <h1 className="fade-up delay-1 font-black leading-[1.08] tracking-tight mb-6"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
          Send money<br />
          <span className="gradient-text">like a message.</span>
        </h1>

        {/* Sub */}
        <p className="fade-up delay-2 max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', color: '#8888AA' }}>
          KRYPTOX is the world's first <strong className="text-white font-semibold">@username crypto wallet</strong> with
          built-in chat, business invoicing, staking, and instant swaps —
          all in one app. <span className="text-white/80">190+ countries. Zero bank. Zero ID.</span>
        </p>

        {/* CTA */}
        <div className="fade-up delay-3 flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
          <Link href="/onboarding"
            className="group flex items-center gap-3 font-bold px-8 py-4 rounded-2xl text-white text-base transition-all hover:-translate-y-1 hover:shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #7B5EA7, #4A90D9)', boxShadow: '0 0 0 0 rgba(123,94,167,0.4)', transition: 'all 0.25s ease' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 16px 48px rgba(123,94,167,0.5)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 0 0 rgba(123,94,167,0.4)'}>
            🚀 Create Free Wallet
          </Link>
          <Link href="/onboarding?mode=login"
            className="flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl text-white/80 hover:text-white text-base transition-all border hover:border-white/20"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
            I Already Have a Wallet →
          </Link>
        </div>

        <p className="fade-up delay-4 text-xs mb-16" style={{ color: '#8888AA' }}>
          No KYC · No bank account · No ID · 16 languages · Works on any phone
        </p>

        {/* Phone + floating cards */}
        <motion.div className="relative fade-up delay-3" style={{ y: useTransform(scrollY, [0,400], [0,-30]) }}>
          <PhoneMockup />

          {/* Floating notif — payment received */}
          <motion.div
            className="absolute -left-4 top-16 rounded-2xl px-4 py-3 flex items-center gap-3 border hidden sm:flex"
            style={{ background: 'rgba(18,18,26,0.95)', borderColor: 'rgba(0,217,126,0.3)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            initial={{ opacity:0, x:-40, y:20 }} animate={{ opacity:1, x:0, y:0 }} transition={{ delay:1.2, duration:0.6 }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'rgba(0,217,126,0.15)' }}>💸</div>
            <div>
              <div className="text-xs font-bold text-white">+$240 received</div>
              <div className="text-[10px]" style={{ color: '#8888AA' }}>from @kamol · 2s ago</div>
            </div>
          </motion.div>

          {/* Floating notif — swap done */}
          <motion.div
            className="absolute -right-4 bottom-24 rounded-2xl px-4 py-3 flex items-center gap-3 border hidden sm:flex"
            style={{ background: 'rgba(18,18,26,0.95)', borderColor: 'rgba(74,144,217,0.3)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            initial={{ opacity:0, x:40, y:20 }} animate={{ opacity:1, x:0, y:0 }} transition={{ delay:1.5, duration:0.6 }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(74,144,217,0.15)' }}>⇌</div>
            <div>
              <div className="text-xs font-bold text-white">Swap complete</div>
              <div className="text-[10px]" style={{ color: '#8888AA' }}>100 USDT → 0.028 ETH</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ COIN TICKER ═══ */}
      <section className="relative z-10 py-6 border-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <CoinTicker />
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { ref: s1.ref, val: s1.val, suffix: '+', label: 'Countries Supported' },
            { ref: s4.ref, val: s4.val.toLocaleString(), suffix: '+', label: 'Wallets Created' },
            { ref: s3.ref, val: s3.val, suffix: ' Coins', label: 'Cryptocurrencies' },
            { ref: s2.ref, val: '<' + s2.val, suffix: 's', label: 'Avg Transfer Speed' },
          ].map((s, i) => (
            <motion.div key={i} ref={s.ref} className="text-center"
              initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} transition={{ delay: i*0.1 }} viewport={{ once:true }}>
              <div className="font-black mb-2 gold-text" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
                {s.val}{s.suffix}
              </div>
              <div className="text-sm" style={{ color: '#8888AA' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16"
            initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <div className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-4 border"
              style={{ color: '#9B7EC8', borderColor: 'rgba(155,126,200,0.3)', background: 'rgba(123,94,167,0.1)' }}>
              Everything in one app
            </div>
            <h2 className="font-black mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              Built for the world.<br /><span className="gradient-text">Not just crypto nerds.</span>
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: '#8888AA', fontSize: '1.1rem' }}>
              Eight features that make every other wallet look like a calculator from 2005.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                className="group relative rounded-2xl p-6 border cursor-default transition-all duration-300 hover:-translate-y-1"
                style={{ background: f.bg, borderColor: 'rgba(255,255,255,0.07)' }}
                initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                transition={{ delay: (i % 4) * 0.08 }} viewport={{ once:true }}
                whileHover={{ borderColor: f.accent + '40' }}>
                {/* Tag */}
                <div className="inline-block text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full mb-4"
                  style={{ background: f.accent + '20', color: f.accent }}>
                  {f.tag}
                </div>
                {/* Icon + title */}
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="font-bold text-base mb-2 text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#8888AA' }}>{f.desc}</p>
                {/* Sub-bullets */}
                <div className="space-y-1.5 mt-auto">
                  {f.sub.map(s => (
                    <div key={s} className="flex items-center gap-2 text-xs" style={{ color: f.accent }}>
                      <span className="text-[10px]">✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16"
            initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <div className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-4 border"
              style={{ color: '#F0B429', borderColor: 'rgba(240,180,41,0.3)', background: 'rgba(240,180,41,0.08)' }}>
              How it works
            </div>
            <h2 className="font-black mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
              Up and running in <span className="gold-text">30 seconds flat.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px"
              style={{ background: 'linear-gradient(90deg, rgba(123,94,167,0), rgba(123,94,167,0.4), rgba(123,94,167,0))' }} />

            {HOW_IT_WORKS.map((s, i) => (
              <motion.div key={s.step} className="relative rounded-2xl p-8 border text-center"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.15 }} viewport={{ once:true }}>
                <div className="text-5xl font-black mb-4 gold-text">{s.step}</div>
                <h3 className="font-bold text-lg mb-3 text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8888AA' }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LIVE PRICES STRIP ═══ */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-10"
            initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <h2 className="font-black text-2xl mb-2">19 Coins. <span className="gradient-text">One Wallet.</span></h2>
            <p className="text-sm" style={{ color: '#8888AA' }}>Live prices · Best-rate swaps · Instant transfers</p>
          </motion.div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {Object.entries(COIN_PRICES).map(([sym, price], i) => (
              <motion.div key={sym}
                className="rounded-2xl p-4 border flex flex-col items-center gap-2 hover:-translate-y-1 transition-transform cursor-default"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                initial={{ opacity:0, scale:0.9 }} whileInView={{ opacity:1, scale:1 }}
                transition={{ delay: i * 0.06 }} viewport={{ once:true }}>
                <img src={LOGOS[sym]} alt={sym} width={36} height={36} className="rounded-full" />
                <span className="text-xs font-black text-white">{sym}</span>
                <span className="text-xs font-mono font-semibold text-white">{price}</span>
                <span className={`text-[10px] font-bold ${COIN_POS[sym] ? 'text-green-400' : 'text-red-400'}`}
                  style={{ color: COIN_POS[sym] ? '#00D97E' : '#FF4D4D' }}>
                  {COIN_CHANGE[sym]}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {Object.keys(LOGOS).filter(s => !COIN_PRICES[s]).map(sym => (
              <div key={sym} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', color: '#8888AA' }}>
                <img src={LOGOS[sym]} alt={sym} width={14} height={14} className="rounded-full" />
                {sym}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARE ═══ */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-14"
            initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <div className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-4 border"
              style={{ color: '#00D97E', borderColor: 'rgba(0,217,126,0.3)', background: 'rgba(0,217,126,0.08)' }}>
              Comparison
            </div>
            <h2 className="font-black mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
              Your bank charges fees.<br /><span className="gradient-text">We charge zero.</span>
            </h2>
          </motion.div>

          <motion.div className="rounded-3xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            {/* Header */}
            <div className="grid grid-cols-4 text-center text-xs font-black uppercase tracking-widest py-4 px-6"
              style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-left" style={{ color: '#8888AA' }}>Feature</div>
              <div className="gradient-text">KRYPTOX</div>
              <div style={{ color: '#8888AA' }}>Your Bank</div>
              <div style={{ color: '#8888AA' }}>Other Wallets</div>
            </div>
            {COMPARE.map((row, i) => (
              <div key={row.feature}
                className="grid grid-cols-4 text-center items-center py-4 px-6 text-sm"
                style={{ background: i%2===0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: i < COMPARE.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div className="text-left text-white/80">{row.feature}</div>
                <div>{row.kryptox  ? <span style={{ color:'#00D97E', fontSize:'1.1rem' }}>✓</span> : <span style={{ color:'#FF4D4D', fontSize:'1.1rem' }}>✗</span>}</div>
                <div>{row.bank     ? <span style={{ color:'#00D97E', fontSize:'1.1rem' }}>✓</span> : <span style={{ color:'#FF4D4D', fontSize:'1.1rem' }}>✗</span>}</div>
                <div>{row.other    ? <span style={{ color:'#00D97E', fontSize:'1.1rem' }}>✓</span> : <span style={{ color:'#FF4D4D', fontSize:'1.1rem' }}>✗</span>}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-14"
            initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <h2 className="font-black mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
              Real people.<br /><span className="gradient-text">Real money. Real fast.</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name}
                className="rounded-2xl p-6 border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
                transition={{ delay: i*0.1 }} viewport={{ once:true }}>
                <p className="text-white/80 leading-relaxed mb-5 text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
                    style={{ background: 'rgba(123,94,167,0.2)' }}>{t.flag}</div>
                  <span className="font-bold text-sm gradient-text">{t.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="relative rounded-3xl p-12 text-center overflow-hidden border"
            style={{ borderColor: 'rgba(123,94,167,0.3)' }}
            initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            {/* Background glow */}
            <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(123,94,167,0.15), rgba(74,144,217,0.1))' }} />
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative">
              <div className="text-5xl mb-4">⚡</div>
              <h2 className="font-black mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                Start in 30 seconds.
              </h2>
              <p className="mb-8 max-w-md mx-auto" style={{ color: '#8888AA', fontSize: '1.1rem' }}>
                No bank. No ID. No complicated setup.<br />
                Just a @username and you're in.
              </p>
              <Link href="/onboarding"
                className="inline-flex items-center gap-3 font-black text-lg px-10 py-5 rounded-2xl text-white transition-all hover:-translate-y-1 hover:shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #7B5EA7, #4A90D9)' }}>
                🚀 Create Your Free Wallet
              </Link>
              <p className="mt-5 text-xs" style={{ color: '#8888AA' }}>
                Free forever · Non-custodial · Open source
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 py-12 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #7B5EA7, #4A90D9)' }}>K</div>
                <span className="font-black gradient-text">KRYPTOX</span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: '#8888AA' }}>
                The world's most advanced<br />@username crypto wallet.
              </p>
            </div>
            {/* Links */}
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="space-y-3">
                <div className="font-bold text-white/50 text-xs uppercase tracking-widest mb-4">Product</div>
                {[['Features','#features'],['How it Works','#how'],['@Auctions','/auction'],['Discover','/dashboard/discover']].map(([l,h])=>(
                  <a key={l} href={h} className="block transition-colors hover:text-white" style={{ color: '#8888AA' }}>{l}</a>
                ))}
              </div>
              <div className="space-y-3">
                <div className="font-bold text-white/50 text-xs uppercase tracking-widest mb-4">Account</div>
                {[['Create Wallet','/onboarding'],['Sign In','/onboarding?mode=login'],['Business','/onboarding'],['Staking','/dashboard/earn']].map(([l,h])=>(
                  <Link key={l} href={h} className="block transition-colors hover:text-white" style={{ color: '#8888AA' }}>{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t text-xs"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#8888AA' }}>
            <span>© 2025 KRYPTOX · Worldwide · Demo mode</span>
            <span>Non-custodial · Your keys, your coins.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
