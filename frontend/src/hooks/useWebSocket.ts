import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const [events, setEvents] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('agent:event', (event: any) => {
      setEvents((prev) => [event, ...prev].slice(0, 50));
    });
    socket.on('chat:response', (response: any) => {
      setLastResponse(response);
    });

    return () => { socket.disconnect(); };
  }, []);

  const sendMessage = useCallback((text: string) => {
    setLastResponse(null);
    socketRef.current?.emit('chat:message', { text });
  }, []);

  return { events, sendMessage, connected, lastResponse };
}
