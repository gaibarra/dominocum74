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

export const useAttendance = (game, playersData, selectedPlayersInGame) => {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAttendance = useCallback(async () => {
    if (!game?.id) return;
    setIsLoading(true);
    try {
      const data = await getAttendanceByGame(game.id);
      setAttendance(data);
    } finally {
      setIsLoading(false);
    }
  }, [game?.id]);

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

  const onCheckIn = async (playerId) => {
    try {
      await checkInPlayer(game.id, playerId);
      await loadAttendance();
      toast({ title: 'Asistencia registrada', description: 'Entrada guardada.' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const onCheckOut = async (playerId) => {
    try {
      await checkOutPlayer(game.id, playerId);
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
