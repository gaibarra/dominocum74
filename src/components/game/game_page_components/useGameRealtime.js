import { useEffect, useMemo, useRef, useState } from 'react';
import { apiConfig } from '@/lib/apiClient';

const MAX_BACKOFF = 15000;
const INITIAL_BACKOFF = 1500;

const ensureAbsoluteApiBase = () => {
  const base = apiConfig.baseUrl || '';
  if (!base) return '';
  if (/^https?:\/\//.test(base)) {
    return base.replace(/\/$/, '');
  }
  if (typeof window === 'undefined') return '';
  const prefix = base.startsWith('/') ? '' : '/';
  return `${window.location.origin}${prefix}${base}`.replace(/\/$/, '');
};

const buildWebSocketUrl = (gameId) => {
  if (!gameId) return null;
  const base = ensureAbsoluteApiBase();
  if (!base) return null;
  const httpUrl = `${base}/games/${gameId}/events`;
  const url = new URL(httpUrl);
  if (apiConfig.apiKey) {
    url.searchParams.set('apiKey', apiConfig.apiKey);
  }
  const wsUrl = url.toString().replace(/^http/, 'ws');
  return wsUrl;
};

export const useGameRealtime = ({ gameId, enabled = true, onEvent, onSyncFallback }) => {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;
  const fallbackRef = useRef(onSyncFallback);
  fallbackRef.current = onSyncFallback;
  const [status, setStatus] = useState('disconnected');

  const targetUrl = useMemo(() => {
    if (!enabled || !gameId || !apiConfig.apiKey) return null;
    return buildWebSocketUrl(gameId);
  }, [enabled, gameId]);

  useEffect(() => {
    if (!targetUrl) {
      setStatus('disabled');
      return undefined;
    }

    let ws;
    let retry = 0;
    let closedManually = false;
    let retryTimer;

    const connect = () => {
      ws = new WebSocket(targetUrl);
      ws.addEventListener('open', () => {
        setStatus('connected');
        retry = 0;
      });

      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PING' || data.type === 'READY') return;
          if (handlerRef.current) {
            handlerRef.current(data);
          }
        } catch (err) {
          console.warn('Realtime payload inválido', err);
          fallbackRef.current?.();
        }
      });

      const scheduleRetry = () => {
        if (closedManually) return;
        setStatus('reconnecting');
        const delay = Math.min(INITIAL_BACKOFF * 2 ** retry, MAX_BACKOFF);
        retry += 1;
        retryTimer = setTimeout(connect, delay);
      };

      ws.addEventListener('close', () => {
        if (closedManually) return;
        scheduleRetry();
      });

      ws.addEventListener('error', () => {
        ws?.close();
      });
    };

    connect();

    return () => {
      closedManually = true;
      clearTimeout(retryTimer);
      ws?.close();
    };
  }, [targetUrl]);

  return { status };
};
