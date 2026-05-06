'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { formatAmount } from '@/lib/wallet';

function Avatar({ username }) {
  const colors = ['from-primary to-blue-500', 'from-green/80 to-emerald-600', 'from-gold/80 to-orange-500', 'from-pink-500 to-rose-600'];
  const idx = username.charCodeAt(0) % colors.length;
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center font-bold text-white text-xs flex-shrink-0`}>
      {username[0].toUpperCase()}
    </div>
  );
}

function TextBubble({ msg, isMine }) {
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
      {!isMine && <Avatar username={msg.fromUsername} />}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${isMine ? 'bg-primary/30 border border-primary/20 rounded-br-sm' : 'bg-surface2 border border-border rounded-bl-sm'}`}>
        <p>{msg.text}</p>
        <p className="text-textDim text-xs mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
}

function PaymentBubble({ msg, isMine }) {
  const confirmed = msg.status === 'CONFIRMED';
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
      {!isMine && <Avatar username={msg.fromUsername} />}
      <div className={`max-w-[80%] card rounded-2xl p-4 border-l-4 ${isMine ? 'border-l-primary' : 'border-l-green'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{isMine ? '💸' : '✅'}</span>
          <div>
            <p className="font-semibold text-sm">{isMine ? 'Sent' : 'Received'} {msg.amount} {msg.currency}</p>
            {msg.text && <p className="text-textDim text-xs">{msg.text}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${confirmed ? 'text-green' : 'text-gold'}`}>
            {confirmed ? '✓✓ Confirmed' : '⏳ Pending'}
          </span>
          {msg.txHash && (
            <span className="text-xs text-textDim font-mono">{msg.txHash.slice(0, 8)}...</span>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestBubble({ msg, isMine, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const exp = new Date(msg.createdAt).getTime() + 24 * 60 * 60 * 1000;
      const diff = exp - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [msg.createdAt]);

  const isActive = msg.status === 'SENT' && timeLeft !== 'Expired';

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
      {!isMine && <Avatar username={msg.fromUsername} />}
      <div className="max-w-[80%] card rounded-2xl p-4 border-l-4 border-l-gold">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📨</span>
          <div>
            <p className="font-semibold text-sm">Requesting {msg.amount} {msg.currency}</p>
            {msg.text && <p className="text-textDim text-xs">{msg.text}</p>}
          </div>
        </div>
        <p className="text-xs text-textDim mb-3">Expires: {timeLeft}</p>
        {!isMine && isActive && (
          <div className="flex gap-2">
            <button onClick={() => onAccept(msg.id)} className="flex-1 btn-primary py-2 text-xs font-semibold rounded-xl">Pay Now</button>
            <button onClick={() => onDecline(msg.id)} className="flex-1 border border-border py-2 text-xs font-semibold rounded-xl text-textDim hover:text-white transition-colors">Decline</button>
          </div>
        )}
        {msg.status === 'CONFIRMED' && <p className="text-green text-xs">✓ Paid</p>}
        {msg.status === 'DECLINED' && <p className="text-red text-xs">✗ Declined</p>}
        {timeLeft === 'Expired' && msg.status === 'SENT' && <p className="text-textDim text-xs">Expired</p>}
      </div>
    </div>
  );
}

export default function ChatThreadPage() {
  const { username } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const [showPayPanel, setShowPayPanel] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline] = useState(true);
  const messagesEnd = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const u = localStorage.getItem('kryptox_user');
    if (!u) { router.push('/onboarding'); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    loadMessages(parsed.username);

    // Connect socket
    const socket = connectSocket(parsed.username);
    socketRef.current = socket;
    socket.on('new_message', (msg) => {
      if (
        (msg.fromUsername === username && msg.toUsername === parsed.username) ||
        (msg.fromUsername === parsed.username && msg.toUsername === username)
      ) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [username]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (myUsername) => {
    try {
      const data = await api.get(`/chat/${username}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      // show empty state, don't crash
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() && !amount) return;
    setSending(true);
    setSendErr('');
    try {
      let newMsg;
      if (amount && parseFloat(amount) > 0) {
        const res = await api.post('/wallet/send', {
          toUsername: username,
          amount: parseFloat(amount),
          currency,
          note: text.trim() || null
        });
        newMsg = res.message;
      } else {
        newMsg = await api.post('/chat/send', {
          toUsername: username,
          text: text.trim(),
          type: 'TEXT'
        });
      }
      if (newMsg) setMessages(prev => [...prev, newMsg]);
      setText('');
      setAmount('');
      setShowPayPanel(false);
    } catch (e) {
      setSendErr(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/chat/request/${id}/accept`, {});
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'CONFIRMED' } : m));
    } catch (e) {
      setSendErr(e.message);
    }
  };

  const handleDecline = async (id) => {
    try {
      await api.put(`/chat/request/${id}/decline`, {});
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'DECLINED' } : m));
    } catch (e) {
      setSendErr(e.message);
    }
  };

  const myUsername = user?.username || '';

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-md mx-auto">
      <div className="demo-badge">DEMO</div>

      {/* Header */}
      <div className="glass border-b border-border px-4 py-3 flex items-center gap-3 pt-12 flex-shrink-0">
        <button onClick={() => router.back()} className="text-textDim hover:text-white text-xl">←</button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center font-bold text-white">
          {username[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-semibold">@{username}</div>
          <div className={`text-xs ${isOnline ? 'text-green' : 'text-textDim'}`}>
            {isTyping ? 'typing...' : isOnline ? 'online' : 'offline'}
          </div>
        </div>
        <button onClick={() => router.push(`/u/${username}`)} className="text-textDim hover:text-white">ℹ️</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-textDim text-sm">
            <div className="text-4xl mb-3">💬</div>
            Start the conversation with @{username}
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.fromUsername === myUsername;
          if (msg.type === 'PAYMENT' || msg.type === 'RECEIPT') return <PaymentBubble key={msg.id} msg={msg} isMine={isMine} />;
          if (msg.type === 'REQUEST') return <RequestBubble key={msg.id} msg={msg} isMine={isMine} onAccept={handleAccept} onDecline={handleDecline} />;
          return <TextBubble key={msg.id} msg={msg} isMine={isMine} />;
        })}
        <div ref={messagesEnd} />
      </div>

      {/* Pay Panel */}
      {showPayPanel && (
        <div className="border-t border-border bg-surface px-4 py-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-primary outline-none"
            />
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="bg-surface2 border border-border rounded-xl px-3 py-2 text-white text-sm focus:border-primary outline-none cursor-pointer"
            >
              {['USDT', 'ETH', 'BTC', 'SOL', 'BNB', 'USDC', 'TRX', 'TON'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error */}
      {sendErr && (
        <div className="px-4 py-2 bg-red/10 border-t border-red/20">
          <p className="text-red text-xs">{sendErr}</p>
        </div>
      )}

      {/* Input Bar */}
      <div className="border-t border-border bg-surface px-4 py-3 flex items-center gap-2 safe-bottom flex-shrink-0">
        <button
          onClick={() => { setShowPayPanel(!showPayPanel); setSendErr(''); }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors font-bold ${showPayPanel ? 'bg-primary/20 text-primary' : 'bg-surface2 text-textDim hover:text-white'}`}
        >
          $
        </button>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={showPayPanel ? 'Add a note (optional)...' : 'Message...'}
          className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={(!text.trim() && !amount) || sending}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white disabled:opacity-40 transition-all hover:bg-primaryGlow"
        >
          {sending ? '…' : '↑'}
        </button>
      </div>
    </div>
  );
}
