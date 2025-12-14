// @ts-nocheck
import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
          <div className="text-sm font-medium mb-2">Registrar entrada</div>
          <div className="flex gap-2 items-center">
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecciona jugador (sin mesa ni entrada)" />
              </SelectTrigger>
              <SelectContent>
                {notCheckedInPlayers.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nickname || p.name}
                  </SelectItem>
                ))}
                {notCheckedInPlayers.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No hay jugadores disponibles.
                  </div>
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={async () => {
                if (!selectedPlayerId) return;
                await onCheckIn(selectedPlayerId); // UUID string
                setSelectedPlayerId('');
              }}
              disabled={!selectedPlayerId}
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
