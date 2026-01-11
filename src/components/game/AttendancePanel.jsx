// @ts-nocheck
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resolvePublicMediaUrl } from '@/lib/mediaStorage';

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
  autoOpenSelectKey,
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const lastAutoKeyRef = useRef(null);
  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  useEffect(() => {
    if (!autoOpenSelectKey) return;
    if (lastAutoKeyRef.current === autoOpenSelectKey) return;
    lastAutoKeyRef.current = autoOpenSelectKey;
    setIsSelectOpen(true);
    setSearchTerm('');
  }, [autoOpenSelectKey]);

  useEffect(() => {
    if (!isSelectOpen || typeof document === 'undefined') return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isSelectOpen]);

  const checkedInIds = useMemo(() => new Set(attendance.filter(a => !!a.check_in_time).map(a => String(a.player_id))), [attendance]);
  const notCheckedInPlayers = useMemo(() => {
    const all = Object.values(playersData || {});
    const busyIds = new Set(Array.from(selectedPlayersInGame || []).map(String));
    // Excluir: ya registrados (checked-in) o con mesa activa
    return all.filter(p => !checkedInIds.has(String(p.id)) && !busyIds.has(String(p.id)));
  }, [playersData, checkedInIds, selectedPlayersInGame]);

  const filteredPlayers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return notCheckedInPlayers;
    return notCheckedInPlayers.filter((p) => {
      const name = `${p.nickname || ''} ${p.name || ''}`.toLowerCase();
      return name.includes(term);
    });
  }, [notCheckedInPlayers, searchTerm]);

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
    <>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <button
                type="button"
                onClick={() => {
                  setIsSelectOpen(true);
                  setTimeout(() => {
                    const el = document.getElementById('attendance-search');
                    el?.focus();
                  }, 50);
                }}
                className="h-16 w-full rounded-2xl border-2 border-slate-200 px-5 text-left text-lg font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                {selectedPlayerId
                  ? (playersData?.[selectedPlayerId]?.nickname || playersData?.[selectedPlayerId]?.name || 'Jugador')
                  : 'Selecciona un jugador'}
              </button>
            </div>
            <Button
              onClick={async () => {
                if (!selectedPlayerId) return;
                await onCheckIn(selectedPlayerId);
                setSelectedPlayerId('');
                setIsSelectOpen(false);
              }}
              disabled={!selectedPlayerId}
              className="h-16 rounded-2xl px-8 text-lg font-semibold shadow-lg shadow-sky-400/30"
            >
              Entrada
            </Button>
          </div>
        </div>

        {isSelectOpen && portalTarget && createPortal(
          <div className="fixed inset-0 z-[60] flex flex-col bg-white px-5 pb-20 pt-10">
            <div className="mb-4 flex items-center gap-3">
              <Input
                id="attendance-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar jugador por apodo o nombre..."
                className="h-12 flex-1 rounded-xl border-slate-200 focus-visible:ring-sky-300"
              />
              <Button variant="ghost" onClick={() => setIsSelectOpen(false)} className="shrink-0">
                Cerrar
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredPlayers.map((p) => {
                const displayName = p.name || p.nickname || 'Jugador';
                const photoSrc = resolvePublicMediaUrl(p.photo || '/domino-icon.svg');
                const meta = `${p.nickname || ''} ${p.name || ''}`.trim();
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlayerId(String(p.id));
                      setIsSelectOpen(false);
                      setSearchTerm('');
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left shadow-sm transition hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                        <img src={photoSrc} alt={displayName} className="h-full w-full object-cover" />
                      </span>
                      <span className="flex flex-col leading-tight">
                        <span className="font-semibold text-slate-900">{displayName}</span>
                        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
                      </span>
                    </span>
                  </button>
                );
              })}
              {filteredPlayers.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No hay coincidencias.
                </div>
              )}
            </div>
          </div>,
          portalTarget
        )}

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
    </>
  );
}
