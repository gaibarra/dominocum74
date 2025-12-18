// @ts-nocheck
import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

export default function AttendancePanel({
  game,
  playersData,
  attendance,
  benchPlayers,
  onCheckIn,
  onCheckOut,
  onBackfillNextDay,
  selectedPlayersInGame,
  id,
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [playerQuery, setPlayerQuery] = useState('');

  const checkedInIds = useMemo(() => new Set(attendance.filter(a => !!a.check_in_time).map(a => String(a.player_id))), [attendance]);
  const notCheckedInPlayers = useMemo(() => {
    const all = Object.values(playersData || {});
    const busyIds = new Set(Array.from(selectedPlayersInGame || []).map(String));
    // Excluir: ya registrados (checked-in) o con mesa activa
    return all.filter(p => !checkedInIds.has(String(p.id)) && !busyIds.has(String(p.id)));
  }, [playersData, checkedInIds, selectedPlayersInGame]);

  const sanitizedBenchPlayers = useMemo(
    () => (Array.isArray(benchPlayers) ? benchPlayers.filter(Boolean) : []),
    [benchPlayers]
  );

  const filteredPlayers = useMemo(() => {
    if (!playerQuery) return notCheckedInPlayers;
    const normalized = playerQuery.trim().toLowerCase();
    if (!normalized) return notCheckedInPlayers;
    return notCheckedInPlayers.filter((player) => {
      const haystack = `${player.nickname || ''} ${player.name || ''}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [notCheckedInPlayers, playerQuery]);

  const hasMissingCheckouts = useMemo(() => attendance.some(a => a.check_in_time && !a.check_out_time), [attendance]);
  const canBackfill = useMemo(() => dayjs().diff(dayjs(game?.date), 'day') >= 1 && hasMissingCheckouts, [game?.date, hasMissingCheckouts]);

  const formatElapsed = (playerId) => {
    const a = attendance.find(x => x.player_id === playerId && x.check_in_time && !x.check_out_time);
    if (!a) return null;
    const mins = dayjs().diff(dayjs(a.check_in_time), 'minute');
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  };

  return (
    <Card id={id} className="bg-card/80 backdrop-blur-sm shadow rounded-xl border border-border/50 mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Asistencia</CardTitle>
        {canBackfill && (
          <Button size="sm" variant="outline" onClick={onBackfillNextDay}>
            Completar salidas pendientes
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="text-sm font-medium mb-3">Registrar entrada</div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={playerQuery}
                  onChange={(event) => setPlayerQuery(event.target.value)}
                  placeholder="Busca por apodo o nombre"
                  className="h-12 rounded-2xl border-2 border-slate-200 pl-11 text-base"
                />
              </div>
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger className="h-16 w-full rounded-2xl border-2 border-slate-200 px-5 text-left text-lg font-semibold focus:ring-2 focus:ring-sky-300">
                  <SelectValue placeholder="Selecciona jugador (sin mesa ni entrada)" />
                </SelectTrigger>
                <SelectContent className="max-h-80 w-[360px] rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl">
                  {filteredPlayers.map((p) => {
                    const displayName = p.nickname || p.name || 'Jugador';
                    const subtitle = p.name && p.nickname ? p.name : p.nickname ? 'Sin nombre oficial' : 'Sin apodo';
                    const photoSrc = typeof p.photo === 'string' && p.photo.length > 0 ? p.photo : '/domino-icon.svg';
                    return (
                      <SelectItem
                        key={p.id}
                        value={String(p.id)}
                        className="relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-base data-[state=checked]:bg-sky-100"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                          <img src={photoSrc} alt={displayName} className="h-full w-full object-cover" />
                        </span>
                        <span className="flex flex-col leading-tight">
                          <span className="font-semibold text-slate-900">{displayName}</span>
                          <span className="text-sm text-slate-500">{subtitle}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                  {filteredPlayers.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No encontramos coincidencias.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={async () => {
                if (!selectedPlayerId) return;
                await onCheckIn(selectedPlayerId);
                setSelectedPlayerId('');
                setPlayerQuery('');
              }}
              disabled={!selectedPlayerId}
              className="h-16 rounded-2xl px-8 text-lg font-semibold shadow-lg shadow-sky-400/30"
            >
              Entrada
            </Button>
          </div>
        </div>

        {sanitizedBenchPlayers.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">En funciones de mesero</div>
            <div className="flex flex-wrap gap-4">
              {sanitizedBenchPlayers.map((player, idx) => {
                if (!player || typeof player !== 'object') return null;
                const rawDisplayName = player.nickname || player.name || 'Jugador';
                const displayName = typeof rawDisplayName === 'string' ? rawDisplayName : String(rawDisplayName);
                const legalId = player.id ?? `bench-${idx}`;
                const photoSrc = typeof player.photo === 'string' && player.photo.length > 0 ? player.photo : '/domino-icon.svg';
                const initials = displayName.trim().charAt(0).toUpperCase() || 'J';
                return (
                  <div key={legalId} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {photoSrc ? (
                        <img src={photoSrc} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{displayName}</div>
                      <div className="text-muted-foreground flex items-center gap-2">
                        {player.name || 'Sin nombre'}
                        <span className="text-xs">• {player.id ? (formatElapsed(player.id) || '—') : '—'}</span>
                      </div>
                    </div>
                    {player.id && (
                      <Button size="sm" variant="outline" className="ml-2" onClick={() => onCheckOut(player.id)}>Salir</Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Jugadores activos en mesa: {Array.from(selectedPlayersInGame || []).length}
        </div>
      </CardContent>
    </Card>
  );
}
