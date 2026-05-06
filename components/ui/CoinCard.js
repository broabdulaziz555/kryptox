'use client';
import { getCoinLogo, getCoinColors, formatAmount, formatUSD } from '@/lib/wallet';

export default function CoinCard({ coin, balance, price, usdValue, change24h, onClick, compact = false }) {
  const logoUrl = getCoinLogo(coin);
  const colors = getCoinColors(coin); // now returns { bg, text } correctly
  const isPositive = (change24h || 0) >= 0;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 w-full p-3 rounded-xl bg-[#1A1A26] hover:bg-[#2A2A3A] transition-colors"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.bg }}>
          <img src={logoUrl} alt={coin} className="w-6 h-6 rounded-full" onError={e => { e.target.style.display = 'none'; }} />
        </div>
        <span className="text-white font-semibold text-sm">{coin}</span>
        {balance !== undefined && (
          <span className="text-[#8888AA] text-sm ml-auto font-mono">{formatAmount(balance)}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-4 rounded-2xl bg-[#12121A] hover:bg-[#1A1A26] border border-[#2A2A3A] hover:border-[#7B5EA7]/30 transition-all"
    >
      {/* Logo */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: colors.bg }}
      >
        <img
          src={logoUrl}
          alt={coin}
          className="w-7 h-7 rounded-full"
          onError={e => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
          }}
        />
        <span
          className="hidden items-center justify-center text-xs font-bold"
          style={{ color: colors.text }}
        >
          {coin?.slice(0, 2)}
        </span>
      </div>

      {/* Name + price */}
      <div className="flex-1 text-left min-w-0">
        <div className="text-white font-semibold text-sm">{coin}</div>
        {price !== undefined && (
          <div className="text-[#8888AA] text-xs mt-0.5">{formatUSD(price)}</div>
        )}
      </div>

      {/* Balance + change */}
      <div className="text-right flex-shrink-0">
        {balance !== undefined && (
          <div className="text-white font-semibold text-sm font-mono">{formatAmount(balance)}</div>
        )}
        {usdValue !== undefined && (
          <div className="text-[#8888AA] text-xs mt-0.5">{formatUSD(usdValue)}</div>
        )}
        {change24h !== undefined && balance === undefined && (
          <div className={`text-xs font-medium mt-0.5 ${isPositive ? 'text-[#00D97E]' : 'text-[#FF4D4D]'}`}>
            {isPositive ? '+' : ''}{change24h?.toFixed(2)}%
          </div>
        )}
      </div>
    </button>
  );
}
