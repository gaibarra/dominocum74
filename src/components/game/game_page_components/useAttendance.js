import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { useToast } from '@/components/ui/use-toast';
import { getAttendanceByGame, checkInPlayer, checkOutPlayer, backfillMissingCheckoutsForGame } from '@/lib/storage';

const CLOSED_STATUSES = new Set(['finalizado', 'finalizada', 'cerrado', 'cerrada', 'terminado', 'terminada', 'completado', 'completada']);
const looksClosed = (game) => {
  if (!game) return false;
  if (game.closed_at) return true;
  const normalized = (game.status || '').toString().trim().toLowerCase();
  return CLOSED_STATUSES.has(normalized);
};

const normalizeAttendanceRecord = (record) => {
  if (!record) return null;
  const candidatePlayer = record.player_id ?? record.playerId ?? record.player ?? record.id;
  const player_id = typeof candidatePlayer === 'object'
    ? candidatePlayer?.id ?? candidatePlayer?.player_id ?? null
    : candidatePlayer;
  if (!player_id) return null;

  const fallbackIn = record.timestamp || record.created_at || record.updated_at || null;
  const fallbackOut = record.closed_at || record.closedAt || null;

  return {
    player_id,
    player: typeof candidatePlayer === 'object' ? candidatePlayer : undefined,
    check_in_time: record.check_in_time ?? record.checkInTime ?? record.check_in ?? record.checkIn ?? fallbackIn,
    check_out_time: record.check_out_time ?? record.checkOutTime ?? record.check_out ?? record.checkOut ?? fallbackOut,
  };
};

const dedupeByPlayer = (records = []) => {
  const map = new Map();
  records.forEach((item) => {
    if (!item || !item.player_id) return;
    const key = String(item.player_id);
    const current = map.get(key);
    if (!current) {
      map.set(key, item);
      return;
    }
    const currentTs = current.check_in_time ? Date.parse(current.check_in_time) || 0 : 0;
    const incomingTs = item.check_in_time ? Date.parse(item.check_in_time) || 0 : 0;
    if (incomingTs >= currentTs) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
};

export const useAttendance = (game, playersData, selectedPlayersInGame) => {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAttendance = useCallback(async () => {
    if (!game?.id) return;
    setIsLoading(true);
    try {
      const data = await getAttendanceByGame(game.id);
      const normalized = dedupeByPlayer(
        (data || [])
          .map(normalizeAttendanceRecord)
          .filter((item) => item && item.player_id)
      );
      setAttendance(normalized);
    } catch (error) {
      console.warn('No se pudo cargar asistencia:', error?.message);
      toast({ title: 'Asistencia no disponible', description: 'No pudimos actualizar la asistencia. Revisa conexión o extensión del navegador.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [game?.id, toast]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  // Auto backfill when the game is already closed (or sufficiently old)
  const backfilledRef = useRef(false);
  useEffect(() => {
    if (!game?.id || !attendance?.length) return;
    if (backfilledRef.current) return;
    const hasMissing = attendance.some(a => a.check_in_time && !a.check_out_time);
    const isClosed = looksClosed(game);
    const isOlderThanTwelveHours = game?.date ? dayjs().diff(dayjs(game.date), 'hour') >= 12 : false;
    if (hasMissing && (isClosed || isOlderThanTwelveHours)) {
      backfilledRef.current = true;
      backfillMissingCheckoutsForGame(game).then(() => loadAttendance()).catch(() => {});
    }
  }, [attendance, game, loadAttendance]);

  // Bench: players with active check-in (no check_out_time) not seated on an active table
  const benchPlayers = useMemo(() => {
    const checkedInIds = new Set(
      attendance
        .filter(a => !!a.check_in_time && !a.check_out_time)
        .map(a => String(a.player_id))
    );
    const busy = new Set(Array.from(selectedPlayersInGame || []).map(String));
    const allPlayers = Object.values(playersData || {});
    return allPlayers.filter(p => checkedInIds.has(String(p.id)) && !busy.has(String(p.id)));
  }, [attendance, playersData, selectedPlayersInGame]);

  const onCheckIn = async (playerId, when = new Date().toISOString()) => {
    try {
      await checkInPlayer(game.id, playerId, when);
      setAttendance((prev) => {
        const filtered = (prev || []).filter((a) => String(a.player_id) !== String(playerId));
        return [...filtered, { player_id: playerId, check_in_time: when, check_out_time: null }];
      });
      await loadAttendance();
      toast({ title: 'Asistencia registrada', description: 'Entrada guardada.' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      throw e;
    }
  };

  const onCheckOut = async (playerId, when = new Date().toISOString()) => {
    try {
      await checkOutPlayer(game.id, playerId, when);
      setAttendance((prev) => {
        return (prev || []).map((a) =>
          String(a.player_id) === String(playerId)
            ? { ...a, check_out_time: when }
            : a
        );
      });
      await loadAttendance();
      toast({ title: 'Salida registrada' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const onBackfillNextDay = async () => {
    try {
      const res = await backfillMissingCheckoutsForGame(game);
      if (res.updated > 0) {
        await loadAttendance();
        toast({ title: 'Salidas completadas', description: `${res.updated} jugadores sin salida fueron cerrados automáticamente.` });
      }
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // expose reloader so pages can refresh attendance programmatically
  return { attendance, isLoading, benchPlayers, onCheckIn, onCheckOut, onBackfillNextDay, reloadAttendance: loadAttendance };
};
