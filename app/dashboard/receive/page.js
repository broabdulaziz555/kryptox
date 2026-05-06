'use client';
import { useState, useEffect } from 'react';
import { Copy, Share2 } from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import QRGenerator from '@/components/ui/QRGenerator';
import { useToast } from '@/contexts/ToastContext';

const NETWORKS = ['Ethereum','BSC','Polygon','Arbitrum','Optimism','Avalanche','Base','Solana','Bitcoin','Tron','TON'];

export default function ReceivePage() {
  const { success } = useToast();
  const [address, setAddress] = useState('');
  const [username, setUsername] = useState('');
  const [network, setNetwork]   = useState('Ethereum');
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    const addr = localStorage.getItem('kryptox_address') || '';
    const u    = JSON.parse(localStorage.getItem('kryptox_user') || '{}');
    setAddress(addr);
    setUsername(u.username || '');
  }, []);

  const short = address ? `${address.slice(0,8)}...${address.slice(-6)}` : '—';

  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true); success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kryptox.app';
    const text = `Send me crypto on KRYPTOX!\n@${username}\n${appUrl}/u/${username}`;
    if (navigator.share) { navigator.share({ text }).catch(()=>{}); }
    else { await navigator.clipboard.writeText(text); success('Link copied!'); }
  };

  const NETWORK_COINS = {
    Ethereum:'ETH', BSC:'BNB', Polygon:'MATIC', Arbitrum:'ETH',
    Optimism:'ETH', Avalanche:'AVAX', Base:'ETH', Solana:'SOL',
    Bitcoin:'BTC', Tron:'TRX', TON:'TON',
  };

  return (
    <MobileLayout title="Receive" showBack>
      <div style={{ padding:'24px 16px' }}>

        {/* Network selector */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
            Network
          </div>
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
            {NETWORKS.map(n => (
              <button key={n} onClick={() => setNetwork(n)} style={{
                flexShrink:0, padding:'8px 14px', borderRadius:'var(--radius-full)',
                background: network===n ? 'var(--accent-gradient)' : 'var(--bg-card)',
                border:`1px solid ${network===n ? 'transparent' : 'var(--border)'}`,
                color: network===n ? '#fff' : 'var(--text-secondary)',
                fontWeight:600, fontSize:12, cursor:'pointer', transition:'all 150ms',
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ display:'inline-block', padding:16, background:'var(--bg-card)',
            border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', marginBottom:16 }}>
            <QRGenerator value={address || `kryptox:${username}`} size={200} />
          </div>
          <div style={{ fontWeight:800, fontSize:20, marginBottom:2 }}>@{username}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{network} · {NETWORK_COINS[network] || 'ETH'}</div>
        </div>

        {/* Address card */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:'var(--radius-lg)', padding:16, marginBottom:16 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
            {network} Address
          </div>
          <div style={{ fontFamily:'monospace', fontSize:13, color:'var(--text-primary)', wordBreak:'break-all', marginBottom:12, lineHeight:1.6 }}>
            {address || '—'}
          </div>
          <button onClick={copy} style={{
            display:'flex', alignItems:'center', gap:6,
            background: copied ? 'rgba(0,214,143,0.15)' : 'var(--bg-card-hover)',
            border:`1px solid ${copied ? 'rgba(0,214,143,0.3)' : 'var(--border)'}`,
            borderRadius:'var(--radius-md)', padding:'8px 14px', cursor:'pointer',
            color: copied ? 'var(--accent-green)' : 'var(--text-secondary)',
            fontSize:13, fontWeight:600, transition:'all 150ms',
          }}>
            <Copy size={14} />
            {copied ? '✓ Copied!' : 'Copy Address'}
          </button>
        </div>

        {/* Share */}
        <button onClick={share} className="btn-ghost" style={{ width:'100%', gap:8, marginBottom:16 }}>
          <Share2 size={16} />
          Share Profile Link
        </button>

        {/* Warning */}
        <div style={{ background:'rgba(255,159,67,0.08)', border:'1px solid rgba(255,159,67,0.2)',
          borderRadius:'var(--radius-md)', padding:'12px 14px', fontSize:12, color:'var(--accent-orange)', lineHeight:1.5 }}>
          ⚠️ Only send {NETWORK_COINS[network] || 'ETH'} and compatible tokens to this address on the {network} network.
          Sending other assets may result in permanent loss.
        </div>
      </div>
    </MobileLayout>
  );
}
