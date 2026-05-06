'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';

const DEMO_CONVOS = [
  { username: 'kamol', lastMessage: 'Got it! Thanks bro 🙏', time: '2h', unread: 0, type: 'text' },
  { username: 'jasur', lastMessage: '💸 50 USDT', time: '1d', unread: 2, type: 'payment' },
  { username: 'techshop', lastMessage: '📨 Requesting 349 USDT', time: '3d', unread: 1, type: 'request', isBusiness: true },
  { username: 'cafebar', lastMessage: 'Coffee invoice paid ✓', time: '1w', unread: 0, type: 'receipt', isBusiness: true },
];

function Avatar({ username, size = 10 }) {
  const colors = ['from-primary to-blue-500', 'from-green/80 to-emerald-600', 'from-gold/80 to-orange-500', 'from-pink-500 to-rose-600', 'from-cyan-500 to-blue-500'];
  const idx = username.charCodeAt(0) % colors.length;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
      {username[0].toUpperCase()}
    </div>
  );
}

export default function ChatListPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState(DEMO_CONVOS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('kryptox_user');
    if (!u) return;
    const me = JSON.parse(u);
    loadConversations();

    // Real-time: refresh conversation list when a new message arrives
    const socket = connectSocket(me.username);
    socket.on('new_message', () => loadConversations());
    socket.on('payment_received', () => loadConversations());

    return () => {
      socket.off('new_message');
      socket.off('payment_received');
    };
  }, []);

  const loadConversations = async () => {
    try {
      const data = await api.get('/chat/conversations');
      if (data?.length > 0) {
        setConversations(data.map(c => ({
          username: c.username,
          lastMessage: c.lastMessage?.text || (c.lastMessage?.type === 'PAYMENT' ? `💸 ${c.lastMessage.amount} ${c.lastMessage.currency}` : ''),
          time: formatTime(c.lastMessage?.createdAt),
          unread: c.unreadCount || 0,
          type: c.lastMessage?.type?.toLowerCase() || 'text',
          isBusiness: c.user?.isBusiness
        })));
      }
    } catch (e) { /* use demo */ }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff/60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff/86400000)}d`;
    return `${Math.floor(diff/604800000)}w`;
  };

  const filtered = conversations.filter(c =>
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const getPreviewIcon = (type) => {
    if (type === 'payment') return '💸 ';
    if (type === 'request') return '📨 ';
    if (type === 'receipt') return '✅ ';
    return '';
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <button onClick={() => router.push('/dashboard/discover')}
            className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-lg font-bold">
            +
          </button>
        </div>

        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textDim">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
            className="w-full bg-surface2 border border-border rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-primary outline-none transition-colors" />
        </div>

        <div className="space-y-1">
          {filtered.map(convo => (
            <button key={convo.username} onClick={() => router.push(`/dashboard/chat/${convo.username}`)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-surface2 transition-colors text-left">
              <div className="relative">
                <Avatar username={convo.username} size={12} />
                {convo.isBusiness && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold flex items-center justify-center text-xs">✓</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">@{convo.username}</span>
                  <span className="text-xs text-textDim">{convo.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className={`text-sm truncate ${convo.unread > 0 ? 'text-white font-medium' : 'text-textDim'}`}>
                    {getPreviewIcon(convo.type)}{convo.lastMessage}
                  </span>
                  {convo.unread > 0 && (
                    <span className="ml-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {convo.unread}
                    </span>
                  )}
                  {convo.type === 'request' && convo.unread === 0 && (
                    <span className="ml-2 w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-textDim">
            <div className="text-4xl mb-3">💬</div>
            <p>No conversations yet</p>
            <button onClick={() => router.push('/dashboard/discover')} className="btn-primary px-6 py-3 mt-4 text-sm font-semibold">
              Find people to chat with
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
