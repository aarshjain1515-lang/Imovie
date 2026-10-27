import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(showId) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    try {
      socketRef.current = io(socketUrl, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        timeout: 2000,
      });
      socketRef.current.connect();
    } catch (e) {
      console.warn('Socket initialisation note:', e.message);
    }

    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (e) {}
      }
    };
  }, [showId]);

  const emit = useCallback((event, ...args) => {
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, ...args);
      }
    } catch (e) {}
  }, []);

  const on = useCallback((event, handler) => {
    try {
      socketRef.current?.on(event, handler);
    } catch (e) {}
  }, []);

  const off = useCallback((event, handler) => {
    try {
      socketRef.current?.off(event, handler);
    } catch (e) {}
  }, []);

  return {
    socket: socketRef,
    emit,
    on,
    off,
    connected: Boolean(socketRef.current?.connected),
  };
}
