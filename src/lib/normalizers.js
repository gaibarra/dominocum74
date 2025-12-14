import { convertDateTimeToTimeZone } from './dateUtils';
import { apiConfig } from './apiClient';

const normalizeBase = (value) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const buildUploadsRecord = (input) => {
  if (!input) return null;
  const attempt = (value, baseUrl, isAbsolute) => {
    try {
      const parsed = baseUrl ? new URL(value, baseUrl) : new URL(value);
      if (!parsed.pathname?.startsWith('/uploads')) {
        return null;
      }
      return {
        pathname: parsed.pathname,
        suffix: `${parsed.search || ''}${parsed.hash || ''}`,
        isAbsolute,
      };
    } catch {
      return null;
    }
  };

  return attempt(input, undefined, true) || attempt(input, 'http://placeholder', false);
};

export const resolveMediaUrl = (rawUrl) => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  const record = buildUploadsRecord(trimmed);
  if (!record) {
    return trimmed;
  }
  const base = normalizeBase(apiConfig.uploadsBaseUrl || apiConfig.baseUrl || '');
  if (!base) {
    return record.isAbsolute ? trimmed : `${record.pathname}${record.suffix}`;
  }
  return `${base}${record.pathname}${record.suffix}`;
};

export const normalizeHand = (hand = {}) => ({
  ...hand,
  created_at: convertDateTimeToTimeZone(hand.created_at),
  updated_at: hand.updated_at ? convertDateTimeToTimeZone(hand.updated_at) : null,
  start_time: hand.start_time ? convertDateTimeToTimeZone(hand.start_time) : null,
  end_time: hand.end_time ? convertDateTimeToTimeZone(hand.end_time) : null,
});

export const normalizeAnecdote = (anecdote = {}) => {
  const { media_type, media_url, ...rest } = anecdote || {};
  return {
    ...rest,
    mediaType: media_type || 'text',
    mediaUrl: resolveMediaUrl(media_url),
    date: convertDateTimeToTimeZone(anecdote?.date),
    last_edited: anecdote?.last_edited ? convertDateTimeToTimeZone(anecdote.last_edited) : null,
    created_at: convertDateTimeToTimeZone(anecdote?.created_at),
    updated_at: anecdote?.updated_at ? convertDateTimeToTimeZone(anecdote.updated_at) : null,
  };
};

export const normalizeTable = (table = {}) => ({
  ...table,
  partidaFinished: table.partidaFinished ?? !!table.partida_finished,
  created_at: convertDateTimeToTimeZone(table.created_at),
  updated_at: table.updated_at ? convertDateTimeToTimeZone(table.updated_at) : null,
  finished_at: table.finished_at ? convertDateTimeToTimeZone(table.finished_at) : null,
  pairs: Array.isArray(table.pairs)
    ? table.pairs.map((pair) => ({
        ...pair,
        players: Array.isArray(pair.players) ? pair.players : [],
        created_at: convertDateTimeToTimeZone(pair.created_at),
        updated_at: pair.updated_at ? convertDateTimeToTimeZone(pair.updated_at) : null,
      }))
    : [],
  hands: Array.isArray(table.hands) ? table.hands.map(normalizeHand) : [],
});
