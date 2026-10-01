import { useEffect, useRef } from 'react';
import { connectTicketAnalytics, fetchSocketToken } from '@/services/socketService';

// Shares the existing socket; changes invalidate metadata rather than replacing it.
export function useEventMetadataRefresh(refresh, eventId = null, boundaries = []) {
  const refreshRef = useRef(refresh);
  const runRef = useRef(null);
  refreshRef.current = refresh;

  useEffect(() => {
    let disposed = false;
    let running = false;
    let pending = false;
    let socket;
    const run = async (initial = false) => {
      if (disposed) return;
      if (running) { pending = true; return; }
      running = true;
      try {
        do {
          pending = false;
          await refreshRef.current(initial);
          initial = false;
        } while (pending && !disposed);
      } finally { running = false; }
    };
    const refreshNow = () => { void run(); };
    runRef.current = refreshNow;
    const onVisible = () => { if (document.visibilityState === 'visible') refreshNow(); };
    const onChange = (change) => {
      if (change?.eventId && (!eventId || change.eventId === eventId)) refreshNow();
    };
    void run(true);
    const interval = setInterval(onVisible, 30000);
    window.addEventListener('focus', refreshNow);
    document.addEventListener('visibilitychange', onVisible);
    void (async () => {
      const token = await fetchSocketToken();
      if (disposed || !token) return;
      socket = connectTicketAnalytics(token);
      socket.on('event_changed', onChange);
      socket.on('connect', refreshNow);
      // Catch edits between the initial read and socket subscription.
      if (socket.connected) refreshNow();
    })();
    return () => {
      disposed = true;
      if (runRef.current === refreshNow) runRef.current = null;
      clearInterval(interval);
      window.removeEventListener('focus', refreshNow);
      document.removeEventListener('visibilitychange', onVisible);
      socket?.off('event_changed', onChange);
      socket?.off('connect', refreshNow);
    };
  }, [eventId]);

  const boundaryKey = boundaries.filter(Boolean).join('|');
  useEffect(() => {
    let timer;
    const schedule = () => {
      const next = boundaryKey.split('|').map(value => new Date(value).getTime())
        .filter(value => Number.isFinite(value) && value > Date.now()).sort((a, b) => a - b)[0];
      if (!next) return;
      timer = setTimeout(() => {
        runRef.current?.();
        schedule();
      }, Math.min(next - Date.now() + 50, 2147483647));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [boundaryKey]);
}
