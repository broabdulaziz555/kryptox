'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import { api } from '@/lib/api';

const DEMO_BUSINESSES = [
  { username: 'techshop', name: 'Tech Shop Tashkent', avatar: '🏪', bio: 'Electronics & gadgets. Same day delivery.', isVerified: true, isBusiness: true },
  { username: 'cafebar',  name: 'Cafe Bar Central',   avatar: '☕', bio: 'Best coffee in the city. Pay crypto, get 5% off!', isVerified: true, isBusiness: true },
];

const DEMO_PEOPLE = [
  { username: 'aziz',  avatar: '👨', bio: 'Building the future ⚡', isOnline: true  },
  { username: 'kamol', avatar: '🧑', bio: 'BTC hodler 🟠',          isOnline: false },
  { username: 'jasur', avatar: '👦', bio: 'Dev in Tashkent, UZ',    isOnline: true  },
];

function UserCard({ user, onSend, onView }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-surface2 border border-border flex items-center justify-center text-2xl flex-shrink-0">
        {user.avatar || user.username[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm">@{user.username}</span>
          {user.isVerified && <span className="text-blue-400 text-xs">✓</span>}
          {user.isBusiness && <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full">BIZ</span>}
        </div>
        {(user.name || user.bio) && (
          <p className="text-textDim text-xs truncate mt-0.5">{user.name || user.bio}</p>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onView(user)}
          className="bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs font-semibold hover:border-primary/50 transition-colors">
          View
        </button>
        <button
          onClick={() => onSend(user)}
          className="btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold">
          Send
        </button>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const [q, setQ]           = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fixed: use api.get() not the non-existent api.searchUsers()
  const search = useCallback(async (query) => {
    if (!query.trim()) return setResults([]);
    setLoading(true);
    try {
      const data = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
      setResults(data.users || []);
    } catch {
      // On error, filter demo data as fallback
      const all = [...DEMO_BUSINESSES, ...DEMO_PEOPLE];
      setResults(all.filter(u =>
        u.username.includes(query.toLowerCase()) ||
        (u.name || '').toLowerCase().includes(query.toLowerCase())
      ));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  }, [q, search]);

  const handleView = (user) => {
    router.push(user.isBusiness ? `/biz/${user.username}` : `/u/${user.username}`);
  };

  const handleSend = (user) => {
    router.push(`/dashboard/chat/${user.username}`);
  };

  const showSearch = q.trim().length > 0;

  return (
    <MobileLayout title="Discover" showBack={false}>
      <div className="px-4 pb-24">
        {/* Search bar */}
        <div className="py-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textDim">🔍</span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Find @username or business..."
              className="input w-full pl-9"
            />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-textDim hover:text-white">✕</button>
            )}
          </div>
        </div>

        {/* Search results */}
        {showSearch && (
          <>
            {loading && (
              <div className="text-center py-6 text-textDim text-sm">Searching...</div>
            )}
            {!loading && results.length > 0 && (
              <div className="space-y-2">
                {results.map(u => (
                  <UserCard key={u.username} user={u} onView={handleView} onSend={handleSend} />
                ))}
              </div>
            )}
            {!loading && results.length === 0 && (
              <div className="text-center py-10 text-textDim">
                <div className="text-3xl mb-2">🤷</div>
                <p className="text-sm">No users found for "{q}"</p>
              </div>
            )}
          </>
        )}

        {/* Default content when not searching */}
        {!showSearch && (
          <>
            {/* Businesses */}
            <div className="mb-6">
              <h3 className="text-xs text-textDim uppercase tracking-wider font-bold mb-3">⚡ Businesses</h3>
              <div className="space-y-2">
                {DEMO_BUSINESSES.map(u => (
                  <UserCard key={u.username} user={u} onView={handleView} onSend={handleSend} />
                ))}
              </div>
            </div>

            {/* People */}
            <div className="mb-6">
              <h3 className="text-xs text-textDim uppercase tracking-wider font-bold mb-3">👥 People You May Know</h3>
              <div className="space-y-2">
                {DEMO_PEOPLE.map(u => (
                  <UserCard key={u.username} user={u} onView={handleView} onSend={handleSend} />
                ))}
              </div>
            </div>

            {/* Auction promo */}
            <button
              onClick={() => router.push('/auction')}
              className="w-full bg-gradient-to-r from-gold/10 to-primary/10 border border-gold/20 rounded-2xl p-4 flex items-center gap-3 text-left">
              <span className="text-2xl">🏆</span>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">Premium @Usernames</div>
                <div className="text-textDim text-xs">Bid on @pay, @gold, @uz and more</div>
              </div>
              <span className="text-gold">→</span>
            </button>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
