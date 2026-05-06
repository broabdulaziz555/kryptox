'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateWallet } from '@/lib/wallet';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function OnboardingContent() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || searchParams.get('tab');

  const [step, setStep] = useState(mode === 'login' ? 'login' : 1);
  const [wallet, setWallet] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [seedConfirmed, setSeedConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSeed, setShowSeed] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);

  useEffect(() => {
    if (step === 2) setWallet(generateWallet());
  }, [step]);

  useEffect(() => {
    if (!username || username.length < 3) { setUsernameStatus(null); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      try {
        const data = await api.post('/auth/check-username', { username });
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch { setUsernameStatus(null); }
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.post('/auth/login', { identifier: email, password });
      login(data.token, data.user);
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (usernameStatus !== 'available') { setError('Choose a valid, available username'); return; }
    setLoading(true); setError('');
    try {
      const data = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('kryptox_token', data.token);
      localStorage.setItem('kryptox_user', JSON.stringify(data.user));
      if (data.user?.publicAddress) localStorage.setItem('kryptox_address', data.user.publicAddress);
      setStep('success');
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const SEED_WORDS = wallet?.mnemonic?.split(' ') || [];

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center font-bold text-2xl mx-auto mb-3">K</div>
        <span className="font-bold text-xl">KRYPTOX</span>
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="card p-6 animate-slide-up">
            <h1 className="text-2xl font-bold mb-2">Create your wallet</h1>
            <p className="text-textDim text-sm mb-6">Join the future of payments. Your keys, your crypto.</p>
            <div className="space-y-3 mb-6 text-sm text-textDim">
              {['Self-custodial — you own your keys', '@username instead of long addresses', 'Payments inside chat', '19 coins, all major networks'].map((f, i) => (
                <div key={i} className="flex items-center gap-3"><span className="text-green">✓</span> {f}</div>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="btn-primary w-full py-4 text-base font-semibold">Get Started</button>
            <button onClick={() => setStep('login')} className="w-full py-3 text-sm text-textDim mt-3 hover:text-white transition-colors">
              Already have a wallet? Log in
            </button>
          </div>
        )}

        {/* Step 2: Seed phrase */}
        {step === 2 && wallet && (
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setStep(1)} className="text-textDim hover:text-white">←</button>
              <h2 className="text-xl font-bold">Your Secret Phrase</h2>
            </div>
            <div className="bg-red/10 border border-red/30 rounded-xl p-3 mb-4 text-xs text-red">
              ⚠️ Write these 12 words down. We NEVER store them. Lose them = lose your crypto.
            </div>
            {!showSeed ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔒</div>
                <p className="text-textDim text-sm mb-4">Make sure nobody can see your screen</p>
                <button onClick={() => setShowSeed(true)} className="btn-primary px-6 py-3 text-sm font-semibold">Reveal Seed Phrase</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {SEED_WORDS.map((word, i) => (
                    <div key={i} className="bg-surface2 rounded-xl p-2 text-center">
                      <span className="text-textDim text-xs">{i + 1}.</span>
                      <span className="text-white text-sm font-medium ml-1">{word}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(wallet.mnemonic); setCopiedSeed(true); setTimeout(() => setCopiedSeed(false), 2000); }}
                  className="w-full text-sm text-textDim hover:text-white border border-border rounded-xl py-2 mb-4 transition-colors"
                >
                  {copiedSeed ? '✓ Copied!' : 'Copy to clipboard'}
                </button>
              </>
            )}
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input type="checkbox" checked={seedConfirmed} onChange={e => setSeedConfirmed(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-sm text-textDim">I wrote down my 12-word phrase and understand it cannot be recovered.</span>
            </label>
            <button onClick={() => setStep(3)} disabled={!seedConfirmed || !showSeed}
              className="btn-primary w-full py-4 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Register */}
        {step === 3 && (
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(2)} className="text-textDim hover:text-white">←</button>
              <h2 className="text-xl font-bold">Claim @username</h2>
            </div>
            <div className="mb-4">
              <label className="text-xs text-textDim mb-2 block">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textDim font-medium">@</span>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="yourname" maxLength={20}
                  className="w-full bg-surface2 border border-border rounded-xl pl-8 pr-10 py-3.5 text-white focus:border-primary outline-none transition-colors"
                />
                {usernameStatus === 'checking' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-textDim text-xs animate-pulse">...</span>}
                {usernameStatus === 'available' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green text-lg">✓</span>}
                {usernameStatus === 'taken' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red text-lg">✗</span>}
              </div>
              {usernameStatus === 'available' && <p className="text-green text-xs mt-1">@{username} is available!</p>}
              {usernameStatus === 'taken' && <p className="text-red text-xs mt-1">Already taken. Try another.</p>}
            </div>
            <div className="mb-4">
              <label className="text-xs text-textDim mb-2 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3.5 text-white focus:border-primary outline-none transition-colors" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-textDim mb-2 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3.5 text-white focus:border-primary outline-none transition-colors" />
            </div>
            <div className="mb-6">
              <label className="text-xs text-textDim mb-2 block">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3.5 text-white focus:border-primary outline-none transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleRegister()} />
            </div>
            {error && <p className="text-red text-sm mb-4 bg-red/10 rounded-xl px-4 py-3">{error}</p>}
            <button onClick={handleRegister}
              disabled={loading || usernameStatus !== 'available' || !email || !password || !confirmPassword}
              className="btn-primary w-full py-4 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? 'Creating wallet...' : `Claim @${username || 'username'}`}
            </button>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="card p-6 animate-slide-up text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Wallet Created!</h2>
            <p className="text-textDim mb-6">Welcome to KRYPTOX, <span className="text-white font-semibold">@{username}</span></p>
            <div className="bg-green/10 border border-green/30 rounded-xl p-4 mb-6 text-sm text-green">
              ✓ 100 USDT + demo balance added to your account
            </div>
            <button onClick={() => router.push('/dashboard/home')} className="btn-primary w-full py-4 text-base font-semibold">
              Open Wallet →
            </button>
          </div>
        )}

        {/* Login */}
        {step === 'login' && (
          <div className="card p-6 animate-slide-up">
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-textDim text-sm mb-6">Sign in to your wallet</p>
            <div className="mb-4">
              <label className="text-xs text-textDim mb-2 block">Email or @username</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com or @username"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3.5 text-white focus:border-primary outline-none transition-colors" />
            </div>
            <div className="mb-6">
              <label className="text-xs text-textDim mb-2 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3.5 text-white focus:border-primary outline-none transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            {error && <p className="text-red text-sm mb-4 bg-red/10 rounded-xl px-4 py-3">{error}</p>}
            <button onClick={handleLogin} disabled={loading || !email || !password}
              className="btn-primary w-full py-4 text-base font-semibold disabled:opacity-40">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="mt-4 bg-surface2 rounded-xl p-3 text-xs text-textDim text-center">
              Demo: <span className="text-gold font-mono">aziz@demo.com</span> / <span className="text-gold font-mono">demo1234</span>
            </div>
            <button onClick={() => setStep(1)} className="w-full py-3 text-sm text-textDim mt-3 hover:text-white transition-colors">
              Create new wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
