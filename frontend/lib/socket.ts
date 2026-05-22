'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000', {
    transports:            ['websocket', 'polling'],
    reconnection:          true,
    reconnectionAttempts:  5,
    reconnectionDelay:     1000,
    reconnectionDelayMax:  5000,
    timeout:               20_000,
  });

  socket.on('connect',          () => console.log('[WS] connected:', socket?.id));
  socket.on('disconnect',       (reason) => console.warn('[WS] disconnected:', reason));
  socket.on('connect_error',    (err)    => console.error('[WS] error:', err.message));
  socket.on('reconnect',        (n)      => console.log(`[WS] reconnected after ${n} attempts`));
  socket.on('reconnect_failed', ()       => console.error('[WS] reconnect failed'));

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
