import { io } from 'socket.io-client';

let socket        = null;
let username_     = null;
let heartbeatTimer = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      transports:  ['websocket', 'polling'],
      autoConnect: false,
      reconnection:      true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    });
  }
  return socket;
}

export function connectSocket(username) {
  const s = getSocket();
  username_ = username;

  const join = () => s.emit('join_room', username);

  if (!s.connected) {
    s.off('connect');           // prevent duplicate listeners
    s.on('connect', join);
    s.connect();
  } else {
    join();
  }

  // Heartbeat — keeps connection alive through aggressive NAT/proxy timeouts
  if (!heartbeatTimer) {
    heartbeatTimer = setInterval(() => {
      if (s.connected) s.emit('ping_kx');
    }, 25_000);
  }

  return s;
}

export function disconnectSocket() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (socket?.connected) {
    socket.off('connect');
    socket.disconnect();
    username_ = null;
  }
}

export default getSocket;
