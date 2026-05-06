'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileLayout from '@/components/layout/MobileLayout';
import { api } from '@/lib/api';
import { formatAmount } from '@/lib/wallet';

const STAKING_CONFIG = [
  { symbol: 'ETH', name: 'Ethereum', apy: 3.8,  color: '#627EEA', icon: '⬡', lockDays: 3 },
  { symbol: 'SOL', name: 'Solana',   apy: 6.5,  color: '#9945FF', icon: '◎', lockDays: 0 },
  { symbol: 'BNB', name: 'BNB',      apy: 3.1,  color: '#F3BA2F', icon: '◆', lockDays: 0 },
  { symbol: 'ADA', name: 'Cardano',  apy: 4.2,  color: '#0033AD', icon: '♦', lockDays: 0 },
];

const FAQ = [
  { q: 'What is staking?',             a: 'Staking lets you earn rewards by locking your crypto to help validate blockchain transactions, earning a yield on your holdings.' },
  { q: 'Is my crypto safe?',           a: 'In demo mode, funds never leave the app. In production, funds go to audited staking contracts with full insurance coverage.' },
  { q: 'When do I receive rewards?',   a: 'Rewards accrue daily and compound automatically into your staked balance. Claim anytime with no minimum threshold.' },
  { q: 'Are there lock-up periods?',   a: 'SOL, BNB and ADA are flexible — unstake instantly. ETH has a ~3 day unbonding period due to network design.' },
];

function StakeModal({ coin, onClose }) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy]     = useState(false);
  const [done, setDone]     = useState(false);
  const [err, setErr]       = useState('');

  // Validate: amount must be a valid positive number <= balance
  const numAmt  = parseFloat(amount);
  const isValid = !isNaN(numAmt) && numAmt > 0 && numAmt <= coin.balance;

  const daily  = isValid ? (numAmt * coin.apy / 100 / 365).toFixed(6) : '—';
  const yearly = isValid ? (numAmt * coin.apy / 100).toFixed(4)        : '—';

  const doStake = async () => {
    if (!isValid) { setErr(`Max available: ${formatAmount(coin.balance)} ${coin.symbol}`); return; }
    setBusy(true); setErr('');
    await new Promise(r => setTimeout(r, 1400)); // demo delay
    setBusy(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={onClose}>
      <motion.div
        className="w-full bg-surface border-t border-border rounded-t-3xl p-6"
        initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-black mb-1">Staking Active!</h3>
            <p className="text-textDim text-sm mb-1">{amount} {coin.symbol} earning {coin.apy}% APY</p>
            <p className="text-xs text-textDim mb-6">Est. yearly: <span className="text-green">+{yearly} {coin.symbol}</span></p>
            <button onClick={onClose} className="btn-primary px-8 py-3">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black">Stake {coin.symbol}</h3>
                <p className="gold-text text-sm font-bold">{coin.apy}% APY</p>
              </div>
              <button onClick={onClose} className="text-textDim text-2xl hover:text-white w-9 h-9 flex items-center justify-center">×</button>
            </div>

            <div className="card p-4 mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-textDim">Available balance</span>
                <span className="font-mono">{formatAmount(coin.balance)} {coin.symbol}</span>
              </div>
              {coin.lockDays > 0 && (
                <div className="flex justify-between">
                  <span className="text-textDim">Unbonding period</span>
                  <span className="text-gold">~{coin.lockDays} days</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-1">
              <input
                value={amount}
                onChange={e => { setAmount(e.target.value); setErr(''); }}
                placeholder="Amount to stake"
                type="number"
                min="0"
                max={coin.balance}
                className="input flex-1 text-lg font-bold"
              />
              <button
                onClick={() => { setAmount(String(coin.balance)); setErr(''); }}
                className="bg-surface2 border border-border rounded-xl px-3 text-xs font-bold text-primary hover:border-primary transition-colors">
                MAX
              </button>
            </div>

            {err && <p className="text-red text-xs mb-2">{err}</p>}

            {isValid && (
              <div className="card p-3 mb-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-textDim">Est. daily rewards</span>
                  <span className="text-green font-mono">+{daily} {coin.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textDim">Est. yearly rewards</span>
                  <span className="text-green font-mono">+{yearly} {coin.symbol}</span>
                </div>
              </div>
            )}

            <button
              onClick={doStake}
              disabled={busy || !isValid}
              className="btn-primary w-full py-4 disabled:opacity-40">
              {busy ? '⏳ Staking…' : `Stake ${isValid ? amount : '0'} ${coin.symbol}`}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function EarnPage() {
  const [coins, setCoins]     = useState(STAKING_CONFIG.map(c => ({ ...c, balance: 0, staked: 0 })));
  const [loading, setLoading] = useState(true);
  const [selected, setSelect] = useState(null);
  const [openFaq, setFaq]     = useState(null);

  useEffect(() => {
    api.get('/wallet/balances')
      .then(d => {
        const map = Object.fromEntries((d.balances || []).map(b => [b.symbol, b.amount]));
        setCoins(STAKING_CONFIG.map(c => ({ ...c, balance: map[c.symbol] || 0, staked: 0 })));
      })
      .catch(() => { /* keep zero balances */ })
      .finally(() => setLoading(false));
  }, []);

  const totalStaked  = coins.reduce((s, c) => s + c.staked, 0);
  const totalEarning = coins.filter(c => c.staked > 0).reduce((s, c) => s + c.staked * c.apy / 100, 0);

  return (
    <MobileLayout title="Earn" showBack={false}>
      <div className="px-4 pb-24">

        {/* Hero */}
        <motion.div
          className="bg-gradient-to-br from-primary/20 to-gold/10 border border-primary/30 rounded-3xl p-5 mb-6 mt-2"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-textDim text-xs mb-1">Earn while you hold</p>
          <h2 className="text-3xl font-black mb-1">
            {totalStaked > 0
              ? <span className="gold-text">{totalEarning.toFixed(4)}</span>
              : <span className="text-textDim">0.0000</span>}
          </h2>
          <p className="text-xs text-textDim">Estimated yearly earnings</p>
          {totalStaked === 0 && (
            <p className="text-xs text-primary mt-2 font-semibold">Stake any coin below to start earning →</p>
          )}
        </motion.div>

        {/* Coins */}
        <h3 className="text-xs text-textDim uppercase tracking-wider font-bold mb-3">Available to Stake</h3>
        <div className="space-y-3 mb-8">
          {loading ? (
            [1,2,3,4].map(i => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div className="shimmer w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="shimmer h-4 w-24 rounded-xl" />
                  <div className="shimmer h-3 w-16 rounded-xl" />
                </div>
                <div className="shimmer h-6 w-16 rounded-xl" />
              </div>
            ))
          ) : coins.map((c, i) => (
            <motion.div key={c.symbol} className="card p-4"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${c.color}22`, color: c.color }}>{c.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{c.symbol}</span>
                    <span className="gold-text font-black text-sm">{c.apy}% APY</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-textDim text-xs">{c.name}</span>
                    <span className={`text-xs ${c.balance > 0 ? 'text-textDim' : 'text-red/60'}`}>
                      {c.balance > 0 ? `${formatAmount(c.balance)} available` : 'No balance'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setSelect(c)}
                  disabled={c.balance <= 0}
                  className="btn-primary flex-1 py-2 text-sm disabled:opacity-40">
                  {c.staked > 0 ? 'Add More' : 'Stake'}
                </button>
                {c.staked > 0 && (
                  <button className="btn-ghost flex-1 py-2 text-sm">Unstake</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <h3 className="text-xs text-textDim uppercase tracking-wider font-bold mb-3">How Staking Works</h3>
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left">
                <span className="font-semibold text-sm pr-4">{f.q}</span>
                <span className={`text-textDim transition-transform duration-200 flex-shrink-0 ${openFaq===i ? 'rotate-180' : ''}`}>▾</span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <p className="px-4 pb-4 text-sm text-textDim leading-relaxed">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && <StakeModal coin={selected} onClose={() => setSelect(null)} />}
      </AnimatePresence>
    </MobileLayout>
  );
}
