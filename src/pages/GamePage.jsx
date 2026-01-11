// src/pages/GamePage.jsx
import React, { useState, useCallback, useMemo, Suspense, lazy } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, RefreshCw, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { useGameData } from "@/components/game/game_page_components/useGameData";
import { useTableManagement } from "@/components/game/game_page_components/useTableManagement";
import { useHandManagement } from "@/components/game/game_page_components/useHandManagement";
import { useAnecdotes } from "@/components/game/game_page_components/useAnecdotes";
import { useAttendance } from "@/components/game/game_page_components/useAttendance";
import { useGameRealtime } from "@/components/game/game_page_components/useGameRealtime";
import { normalizeHand, normalizeTable, normalizeAnecdote } from "@/lib/normalizers";
import { computePairTotals } from "@/lib/gameCalculations";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { useActiveVelada } from "@/context/ActiveVeladaContext";
// @ts-ignore
import AttendancePanel from "@/components/game/AttendancePanel";
// @ts-ignore
import { finalizeTablePartidaDB, cancelPendingTableDB, checkInPlayer } from "@/lib/storage";

// @ts-ignore
const GameHeader = lazy(() => import("@/components/game/GameHeader"));
// @ts-ignore
const GameTablesDisplay = lazy(() => import("@/components/game/GameTablesDisplay"));
// @ts-ignore
const AnecdoteSection = lazy(() => import("@/components/game/AnecdoteSection"));
// @ts-ignore
const AddTableDialog = lazy(() => import("@/components/game/AddTableDialog"));
// @ts-ignore
const AnecdoteDialog = lazy(() => import("@/components/game/AnecdoteDialog"));
// @ts-ignore
const EditHandDialog = lazy(() => import("@/components/game/EditHandDialog"));

/**
 * @typedef {Object} Hand
 * @property {number} hand_number
 * @property {number=} pair_1_score
 * @property {number=} pair_2_score
 */

/**
 * @typedef {Object} Table
 * @property {string|number} id
 * @property {number|string} table_number
 * @property {boolean} partidaFinished
 * @property {number=} points_to_win_partida
 * @property {{ players: (string|number)[] }[]=} pairs
 * @property {Hand[]=} hands
 */

/**
 * @param {() => void} cb
 */
const scheduleIdle = (cb) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    // @ts-ignore
    return window.requestIdleCallback(cb, { timeout: 1500 });
  }
  return setTimeout(cb, 300);
};

// ...rest of file remains the same

const GamePage = () => {
  const { toast } = useToast();
  const {
    game,
    setGame,
    playersData,
    isLoading,
    error,
    fetchGameAndPlayersData,
  } = useGameData();

  const {
    isAddTableDialogOpen,
    setIsAddTableDialogOpen,
    handleOpenAddTableDialog,
    handleSaveNewTable,
  } = useTableManagement(game, fetchGameAndPlayersData);

  const {
    currentHandScores,
    handleScoreChange,
    handleAddHand,
    handleOpenEditHandDialog,
    handleSaveEditedHand,
    editingHand,
    isEditHandDialogOpen,
    setIsEditHandDialogOpen,
  } = useHandManagement(
    game,
    setGame,
    fetchGameAndPlayersData,
    toast
  );

  const {
    isAnecdoteDialogOpen,
    setIsAnecdoteDialogOpen,
    currentAnecdoteText,
    setCurrentAnecdoteText,
    currentAnecdoteType,
    setCurrentAnecdoteType,
    currentAnecdoteMediaUrl,
    setCurrentAnecdoteMediaUrl,
    uploadedFileName,
    isUploadingMedia,
    dialogTitle,
    handleOpenAddAnecdoteDialog,
    handleOpenEditAnecdoteDialog,
    handleMediaFileSelected,
    handleSaveAnecdote,
    handleDeleteAnecdote,
  } = useAnecdotes(game, setGame, fetchGameAndPlayersData);

  const requestFullRefresh = React.useCallback(() => {
    fetchGameAndPlayersData();
  }, [fetchGameAndPlayersData]);

  const [searchParams, setSearchParams] = useSearchParams();
  const shouldFocusAttendance = searchParams.get("focus") === "attendance";
  const [highlightAttendance, setHighlightAttendance] = useState(false);
  const hasAutoFocusedAttendance = React.useRef(false);
  const attendanceScrollTimers = React.useRef({ scroll: null, reset: null });

  const registerParam = searchParams.get("register");
  const [autoRegisterKey, setAutoRegisterKey] = useState(null);

  React.useEffect(() => {
    if (registerParam !== "auto") return;
    setAutoRegisterKey(`${Date.now()}`);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("register");
    setSearchParams(next, { replace: true });
  }, [registerParam, searchParams, setSearchParams]);

  const focusAttendancePanel = useCallback(() => {
    if (attendanceScrollTimers.current.scroll) {
      clearTimeout(attendanceScrollTimers.current.scroll);
    }
    if (attendanceScrollTimers.current.reset) {
      clearTimeout(attendanceScrollTimers.current.reset);
    }
    setHighlightAttendance(true);
    attendanceScrollTimers.current.scroll = setTimeout(() => {
      document?.getElementById("attendance")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    attendanceScrollTimers.current.reset = setTimeout(() => {
      setHighlightAttendance(false);
    }, 2400);
  }, []);

  const handleRealtimeEvent = React.useCallback((event) => {
    if (!event?.type) return;

    const ensureTableUpdate = (updater) => {
      let applied = false;
      setGame((prev) => {
        if (!prev || !Array.isArray(prev.tables)) return prev;
        let updated = false;
        const tables = prev.tables.map((table) => {
          if (table.id !== event.tableId) return table;
          updated = true;
          return updater(table);
        });
        applied = updated;
        return updated ? { ...prev, tables } : prev;
      });
      if (!applied) {
        requestFullRefresh();
      }
    };

    switch (event.type) {
      case 'HAND_ADDED':
      case 'HAND_UPDATED': {
        const normalized = normalizeHand(event.payload?.hand || {});
        ensureTableUpdate((table) => {
          const hands = Array.isArray(table.hands) ? [...table.hands] : [];
          const idx = hands.findIndex((h) => h.id === normalized.id);
          if (idx >= 0) {
            hands[idx] = normalized;
          } else {
            hands.push(normalized);
          }
          hands.sort((a, b) => (a.hand_number || 0) - (b.hand_number || 0));
          return { ...table, hands };
        });
        break;
      }
      case 'PAIR_SCORES_UPDATED': {
        const payload = event.payload || {};
        ensureTableUpdate((table) => ({
          ...table,
          games_won_pair1: payload.gamesWonPair1,
          games_won_pair2: payload.gamesWonPair2,
          pairs: Array.isArray(table.pairs)
            ? table.pairs.map((pair) => {
                if (pair.id === payload.pair1Id) {
                  return { ...pair, score: payload.pair1Score };
                }
                if (pair.id === payload.pair2Id) {
                  return { ...pair, score: payload.pair2Score };
                }
                return pair;
              })
            : table.pairs,
        }));
        break;
      }
      case 'TABLE_FINALIZED': {
        const updates = event.payload || {};
        ensureTableUpdate((table) => ({
          ...table,
          ...updates,
          partidaFinished: true,
        }));
        break;
      }
      case 'TABLE_CANCELLED': {
        let removed = false;
        setGame((prev) => {
          if (!prev || !Array.isArray(prev.tables)) return prev;
          if (!prev.tables.some((t) => t.id === event.tableId)) return prev;
          removed = true;
          return {
            ...prev,
            tables: prev.tables.filter((t) => t.id !== event.tableId),
          };
        });
        if (!removed) {
          requestFullRefresh();
        }
        break;
      }
      case 'TABLE_CREATED': {
        const table = normalizeTable(event.payload?.table || {});
        setGame((prev) => {
          if (!prev) return prev;
          if (prev.tables?.some((t) => t.id === table.id)) return prev;
          const tables = [...(prev.tables || []), table].sort((a, b) => Number(a.table_number) - Number(b.table_number));
          return { ...prev, tables };
        });
        break;
      }
      case 'ANECDOTE_CREATED': {
        const anecdote = normalizeAnecdote(event.payload?.anecdote || {});
        setGame((prev) => {
          if (!prev) return prev;
          const filtered = (prev.anecdotes || []).filter((a) => a.id !== anecdote.id);
          const anecdotes = [anecdote, ...filtered].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
          return { ...prev, anecdotes };
        });
        break;
      }
      case 'ANECDOTE_UPDATED': {
        const anecdote = normalizeAnecdote(event.payload?.anecdote || {});
        setGame((prev) => {
          if (!prev) return prev;
          const anecdotes = (prev.anecdotes || []).map((item) => (item.id === anecdote.id ? anecdote : item));
          return { ...prev, anecdotes };
        });
        break;
      }
      case 'ANECDOTE_DELETED': {
        const { anecdoteId } = event.payload || {};
        setGame((prev) => {
          if (!prev) return prev;
          if (!anecdoteId) return prev;
          return {
            ...prev,
            anecdotes: (prev.anecdotes || []).filter((item) => item.id !== anecdoteId),
          };
        });
        break;
      }
      default:
        requestFullRefresh();
        break;
    }
  }, [requestFullRefresh, setGame]);

  useGameRealtime({
    gameId: game?.id,
    enabled: !!game,
    onEvent: handleRealtimeEvent,
    onSyncFallback: requestFullRefresh,
  });

  // Prefetch probable chunks on idle (next interactions)
  React.useEffect(() => {
    const cancel = scheduleIdle(async () => {
      // Preload dialog chunks commonly used
      // @ts-ignore
      import("@/components/game/EditHandDialog");
      // @ts-ignore
      import("@/components/game/AnecdoteDialog");
      // Heuristic: users often abren "Agregar Mesa" pronto
      // @ts-ignore
      import("@/components/game/AddTableDialog");
    });
    return () => {
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        // @ts-ignore
        window.cancelIdleCallback(cancel);
      } else {
        clearTimeout(cancel);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!shouldFocusAttendance || hasAutoFocusedAttendance.current) return;
    if (isLoading || !game?.id) return;
    hasAutoFocusedAttendance.current = true;
    focusAttendancePanel();
    return () => {
      if (attendanceScrollTimers.current.scroll) {
        clearTimeout(attendanceScrollTimers.current.scroll);
      }
      if (attendanceScrollTimers.current.reset) {
        clearTimeout(attendanceScrollTimers.current.reset);
      }
    };
  }, [shouldFocusAttendance, isLoading, game?.id, focusAttendancePanel]);

  // controla vista de mesas activas vs finalizadas
  const [showFinishedTables, setShowFinishedTables] = useState(false);

  // Permite enfocar una mesa específica en el listado de mesas (p.ej. recién finalizada)
  const [selectedTableId, setSelectedTableId] = useState(null);

  // (handleFinishTable se define más abajo, después de useAttendance)

  // jugadores ocupados en mesas NO finalizadas
  const selectedPlayersInGame = useMemo(() => {
    const ocupados = new Set();
    if (!game?.tables) return ocupados;
    game.tables.forEach((/** @type {any} */ table) => {
      if (!table.partidaFinished) {
        table.pairs.forEach((/** @type {any} */ pair) =>
          pair.players.forEach((/** @type {any} */ pid) => ocupados.add(pid))
        );
      }
    });
    return ocupados;
  }, [game?.tables]);

  // Attendance: check-in/out + bench visualization (declare before any early returns)
  const { attendance, benchPlayers, onCheckIn, onCheckOut, onBackfillNextDay, reloadAttendance } = useAttendance(
    game,
    playersData,
    selectedPlayersInGame
  );

  const checkedInIds = useMemo(
    () => new Set(attendance.filter((a) => !!a.check_in_time).map((a) => String(a.player_id))),
    [attendance]
  );

  const presentCount = React.useMemo(() => {
    if (!Array.isArray(attendance)) return 0;
    const ids = new Set(attendance.filter((/** @type {any} */ a) => a.check_in_time && !a.check_out_time).map((/** @type {any} */ a) => a.player_id));
    return ids.size;
  }, [attendance]);
  const benchCount = Array.isArray(benchPlayers) ? benchPlayers.length : 0;

  const { setSummary: setActiveVeladaSummary } = useActiveVelada() || {};

  React.useEffect(() => {
    if (!setActiveVeladaSummary) return;
    if (!game) {
      setActiveVeladaSummary(null);
      return;
    }

    setActiveVeladaSummary({
      id: game.id,
      title: `Velada del ${formatDateForDisplay(game.date)}`,
      status: game.status || "Sin estado",
      location: game.locationName || game.locationDetails || "Ubicación pendiente",
      present: presentCount,
      bench: benchCount,
    });
  }, [benchCount, game, presentCount, setActiveVeladaSummary]);

  const tableProgress = useMemo(() => {
    const result = { active: 0, finished: 0, hands: 0, lastHand: null };
    (game?.tables || []).forEach((table) => {
      if (table?.partidaFinished) {
        result.finished += 1;
      } else {
        result.active += 1;
      }
      (table?.hands || []).forEach((hand) => {
        result.hands += 1;
        const timestamp = hand?.end_time || hand?.updated_at || hand?.created_at;
        if (!timestamp) return;
        const candidate = dayjs(timestamp);
        if (!result.lastHand || candidate.isAfter(result.lastHand)) {
          result.lastHand = candidate;
        }
      });
    });
    return result;
  }, [game?.tables]);

  const lastHandAgo = useMemo(() => {
    if (!tableProgress.lastHand) return null;
    const minutes = Math.max(dayjs().diff(tableProgress.lastHand, 'minute'), 0);
    if (minutes < 1) return 'menos de un minuto';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return `${hours}h ${remaining}m`;
  }, [tableProgress.lastHand]);

  const totalPlayers = Object.keys(playersData || {}).length;
  const targetTables = Math.max(1, Math.ceil(Math.max(presentCount, 0) / 4)) || 1;

  const controlMetrics = useMemo(() => {
    const alertMessage = presentCount >= 4 && tableProgress.active === 0
      ? 'Hay jugadores disponibles sin mesa activa. Abre una mesa para arrancar la velada.'
      : benchCount < 4 && tableProgress.active > 0
      ? 'La banca es reducida; rota jugadores para mantener el ritmo de juego.'
      : null;

    const nextClosing = game?.status === 'Finalizada'
      ? 'Velada cerrada. Revisa estadísticas y comparte resultados.'
      : 'Finaliza la velada cuando no queden mesas en juego.';

    return {
      presentCount,
      benchCount,
      totalPlayers,
      activeTables: tableProgress.active,
      finishedTables: tableProgress.finished,
      targetTables,
      handsLogged: tableProgress.hands,
      lastHandAt: lastHandAgo,
      alert: alertMessage,
      nextClosing,
    };
  }, [benchCount, game?.status, lastHandAgo, presentCount, tableProgress.active, tableProgress.finished, tableProgress.hands, targetTables, totalPlayers]);

  // marca una mesa como finalizada (persistente): incrementa contador y libera jugadores a Banca
  const handleFinishTable = useCallback(async (tableId) => {
    const table = game?.tables?.find((/** @type {any} */ t) => t.id === tableId);
    if (!table || table.partidaFinished) return;
    const totals = computePairTotals(table);
    const p1 = totals.pair1;
    const p2 = totals.pair2;
    const toWin = totals.target;
    if (p1 < toWin && p2 < toWin) {
      toast({
        title: 'No puedes cerrar todavía',
        description: 'Ninguna pareja ha alcanzado la meta de puntos. Revisa la última mano antes de confirmar.',
        variant: 'destructive'
      });
      return;
    }
    let inc1 = 0;
    let inc2 = 0;
    if (p1 > p2) inc1 = 1;
    else if (p2 > p1) inc2 = 1;
    try {
      const updated = await finalizeTablePartidaDB(tableId, { incrementPair1: inc1, incrementPair2: inc2 });
      setGame((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => (t.id === tableId ? { ...t, ...updated, partidaFinished: true } : t))
      }));

      // Asegurar banca: si algún jugador no tiene check-in activo, hacer check-in
      try {
        const seated = (table.pairs || []).flatMap((p) => p.players).filter(Boolean);
        const activeSet = new Set(
          (attendance || [])
            .filter((a) => a.check_in_time && !a.check_out_time)
            .map((a) => String(a.player_id))
        );
        for (const pid of seated) {
          if (!activeSet.has(String(pid))) {
            await checkInPlayer(game.id, pid);
          }
        }
      } catch {}

      // Refrescar asistencia (banca) y datos del juego
      await reloadAttendance?.();
      await fetchGameAndPlayersData();

      toast({ title: 'Partida finalizada', description: `Mesa ${table.table_number} cerrada.` });
      setShowFinishedTables(true);
      setSelectedTableId(tableId);
    } catch (e) {
      console.error('Error finalizando partida:', e);
      const perm = (e?.code === '42501') || /permission denied/i.test(e?.message||'');
      toast({
        title: 'No se pudo finalizar',
        description: perm ? 'Necesitas permisos de organizador para cerrar partidas.' : 'Revisa tu conexión o intenta nuevamente.',
        variant: 'destructive'
      });
    }
  }, [game?.tables, game?.id, attendance, reloadAttendance, setGame, toast, fetchGameAndPlayersData]);

  const handleCancelTable = useCallback(async (tableId) => {
    const table = game?.tables?.find((/** @type {any} */ t) => t.id === tableId);
    if (!table) return;
    if (table.partidaFinished) {
      toast({
        title: 'No se puede cancelar',
        description: 'Esta mesa ya fue finalizada.',
        variant: 'destructive'
      });
      return;
    }
    try {
      await cancelPendingTableDB(tableId);
      setGame((prev) => ({
        ...prev,
        tables: prev.tables.filter((t) => t.id !== tableId)
      }));

      // Garantizar que los jugadores sigan presentes y libres en la banca
      try {
        const seatedPlayers = (table.pairs || []).flatMap((pair) => pair.players).filter(Boolean);
        if (game?.id && seatedPlayers.length) {
          const activeAttendance = new Set(
            (attendance || [])
              .filter((a) => a.check_in_time && !a.check_out_time)
              .map((a) => String(a.player_id))
          );
          for (const pid of seatedPlayers) {
            if (!activeAttendance.has(String(pid))) {
              await checkInPlayer(game.id, pid);
            }
          }
        }
      } catch (err) {
        console.warn('No se pudo reactivar asistencia tras cancelar mesa:', err?.message || err);
      }

      await reloadAttendance?.();
      toast({
        title: 'Mesa cancelada',
        description: `Mesa ${table.table_number} eliminada junto con sus manos.`
      });
      setSelectedTableId(null);
    } catch (e) {
      const permIssue = e?.code === '42501' || /permission denied/i.test(e?.message || '');
      toast({
        title: 'No se pudo cancelar la mesa',
        description: permIssue ? 'Necesitas permisos de organizador para cancelar mesas.' : (e?.message || 'Intenta nuevamente.'),
        variant: 'destructive'
      });
    } finally {
      await fetchGameAndPlayersData();
    }
  }, [game?.tables, game?.id, attendance, reloadAttendance, setGame, toast, fetchGameAndPlayersData]);

  // Abrir "Agregar Mesa" sólo si hay al menos 4 jugadores presentes y libres
  const handleGuardedOpenAddTable = React.useCallback(() => {
    const count = Array.isArray(benchPlayers) ? benchPlayers.length : 0;
    if (count < 4) {
      toast({
        title: 'Faltan jugadores presentes',
        description: 'Pasa lista primero y asegura al menos 4 jugadores presentes y libres para crear una mesa.',
        variant: 'destructive',
      });
      document?.getElementById('attendance')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    handleOpenAddTableDialog();
  }, [benchPlayers, handleOpenAddTableDialog, toast]);

  const controlSteps = useMemo(() => {
    return [
      {
        index: '01',
        title: 'Asistencia',
        subtitle: `Presentes: ${presentCount}`,
        description: presentCount >= 4
          ? 'Listos para armar mesas con la banca actual.'
          : 'Registra al menos 4 jugadores para iniciar la velada.',
        status: presentCount >= 4 ? 'done' : presentCount > 0 ? 'progress' : 'pending',
        action: { label: 'Ir a asistencia', onClick: focusAttendancePanel },
      },
      {
        index: '02',
        title: 'Mesas activas',
        subtitle: `En juego: ${tableProgress.active}`,
        description: tableProgress.active > 0
          ? 'Gestiona puntajes y asegura rotaciones cuando sea necesario.'
          : benchCount >= 4
          ? 'Crea la primera mesa con los jugadores libres.'
          : 'Espera a que lleguen más jugadores para abrir mesas.',
        status: tableProgress.active > 0 ? 'done' : benchCount >= 4 ? 'progress' : 'pending',
        action: { label: 'Crear mesa', onClick: handleGuardedOpenAddTable },
      },
      {
        index: '03',
        title: 'Bitácora de manos',
        subtitle: `Manos registradas: ${tableProgress.hands}`,
        description: tableProgress.hands > 0
          ? 'Continúa registrando para mantener la estadística viva.'
          : 'Aún no se ha documentado ninguna mano.',
        status: tableProgress.hands > 0 ? 'done' : tableProgress.active > 0 ? 'progress' : 'pending',
      },
      {
        index: '04',
        title: 'Cierre de velada',
        subtitle: game?.status === 'Finalizada' ? 'Velada finalizada' : 'Velada en curso',
        description: game?.status === 'Finalizada'
          ? 'Todos los registros han sido cerrados correctamente.'
          : 'Cuando todas las mesas terminen, finaliza la velada desde la cabecera.',
        status: game?.status === 'Finalizada'
          ? 'done'
          : tableProgress.active === 0 && (tableProgress.finished > 0 || presentCount > 0)
          ? 'progress'
          : 'pending',
      },
    ];
  }, [benchCount, focusAttendancePanel, game?.status, handleGuardedOpenAddTable, presentCount, tableProgress.active, tableProgress.finished, tableProgress.hands]);

  if (isLoading) {
    return React.createElement(
      "div",
      { className: "flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white" },
      React.createElement(Loader2, { className: "h-16 w-16 animate-spin text-sky-400 mb-6" }),
      React.createElement("p", { className: "text-2xl font-semibold" }, "Cargando Velada..."),
      React.createElement("p", { className: "text-slate-400" }, "Por favor, espera un momento.")
    );
  }

  if (error && !game) {
    return React.createElement(
      "div",
      { className: "flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 text-center bg-red-50 dark:bg-red-900/10" },
      React.createElement(AlertTriangle, { className: "h-16 w-16 text-red-500 mb-6" }),
      React.createElement("h1", { className: "text-3xl font-bold text-red-700 mb-2" }, "Error de Carga"),
      React.createElement("p", { className: "text-red-600 mb-8 max-w-md" }, error),
      React.createElement(
        "button",
        {
          onClick: fetchGameAndPlayersData,
          className: "inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        },
        React.createElement(RefreshCw, { className: "mr-2 h-4 w-4" }),
        " Reintentar"
      )
    );
  }

  if (!game) {
    return React.createElement(
      "div",
      { className: "flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 text-center" },
      React.createElement(AlertTriangle, { className: "h-16 w-16 text-yellow-500 mb-6" }),
      React.createElement("h1", { className: "text-3xl font-bold mb-2" }, "Velada no Encontrada"),
      React.createElement("p", { className: "text-slate-600 max-w-md mb-8" }, "No se pudo encontrar la velada solicitada."),
      React.createElement(
        "button",
        {
          onClick: () => (window.location.href = "/"),
          className: "px-4 py-2 border rounded-md"
        },
        "Volver al Inicio"
      )
    );
  }

  const playersListForPDF = Object.values(playersData || {});

  return React.createElement(
    "div",
    { className: "container mx-auto px-4 py-8" },
    React.createElement(
      motion.div,
      { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } },
      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { className: "py-6 text-center text-muted-foreground" }, "Cargando cabecera…") },
        React.createElement(
          GameHeader,
          {
            game,
            setGame,
            playersData: playersListForPDF,
            onRefresh: fetchGameAndPlayersData,
            showFinishedTables,
            setShowFinishedTables,
            onAddTable: handleGuardedOpenAddTable,
            presentCount,
            benchCount,
            cardVariants: {
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
            }
          }
        )
      ),

      // Asistencia y banca (más visible)
      React.createElement(
        "div",
        {
          className: `transition-all duration-500 ${highlightAttendance ? "ring-4 ring-sky-400 rounded-2xl shadow-lg" : ""}`
        },
        React.createElement(AttendancePanel, {
          id: "attendance",
          game,
          playersData,
          attendance,
          benchPlayers,
          onCheckIn,
          onCheckOut,
          onBackfillNextDay,
          selectedPlayersInGame,
          autoOpenSelectKey: autoRegisterKey
        })
      ),

      React.createElement(
        "div",
        { id: "tables-section", className: "my-8 p-6 bg-card/80 backdrop-blur-sm shadow-xl rounded-xl border border-border/50" },
        React.createElement("h2", { className: "text-2xl font-semibold text-foreground mb-4" }, "Mesas de Juego"),
        React.createElement(
          Suspense,
          { fallback: React.createElement("div", { className: "py-10 text-center text-muted-foreground" }, "Cargando mesas…") },
          React.createElement(GameTablesDisplay, {
            tables: game.tables,
            playersData,
            currentHandScores,
            onScoreChange: handleScoreChange,
            onSaveHand: handleAddHand,
            onEditHand: handleOpenEditHandDialog,
            onFinishTable: handleFinishTable,
            onCancelTable: handleCancelTable,
            gameStatus: game.status,
            showFinishedTables,
            selectedTableId
          })
        )
      ),

      React.createElement(
        Suspense,
        { fallback: React.createElement("div", { className: "py-6 text-center text-muted-foreground" }, "Cargando anécdotas…") },
        React.createElement(AnecdoteSection, {
          anecdotes: game.anecdotes || [],
          onAddNewAnecdote: handleOpenAddAnecdoteDialog,
          onEditAnecdote: handleOpenEditAnecdoteDialog,
          onDeleteAnecdote: handleDeleteAnecdote,
          cardVariants: {
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
          },
          customDelay: 0.05
        })
      )
    ),

    game && game.status !== "Finalizada" &&
      React.createElement(
        "button",
        {
          type: "button",
          onClick: handleGuardedOpenAddTable,
          className: "fixed bottom-6 right-4 sm:right-6 z-40 inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-white shadow-xl shadow-rose-500/30 transition hover:-translate-y-1 hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200",
          title: benchCount < 4
            ? "Necesitas al menos 4 jugadores libres en banca"
            : "Crear una nueva mesa"
        },
        React.createElement(PlusCircle, { className: "h-5 w-5" }),
        React.createElement("span", { className: "text-sm font-semibold tracking-wide uppercase" }, "Crear mesa")
      ),

    React.createElement(
      AnimatePresence,
      null,
      isAddTableDialogOpen &&
        React.createElement(
          Suspense,
          { fallback: null },
          React.createElement(AddTableDialog, {
            isOpen: isAddTableDialogOpen,
            setIsOpen: setIsAddTableDialogOpen,
            availablePlayers: benchPlayers,
            selectedPlayersInGame,
            onSave: handleSaveNewTable,
            existingTableCount: game.tables.length
          })
        ),

      isEditHandDialogOpen && editingHand &&
        React.createElement(
          Suspense,
          { fallback: null },
          React.createElement(EditHandDialog, {
            isOpen: isEditHandDialogOpen,
            setIsOpen: setIsEditHandDialogOpen,
            hand: editingHand,
            tableNumber: editingHand?.table_number, // Pass tableNumber from editingHand or appropriate source
            onSave: handleSaveEditedHand
          })
        ),

      isAnecdoteDialogOpen &&
        React.createElement(
          Suspense,
          { fallback: null },
          React.createElement(AnecdoteDialog, {
            isOpen: isAnecdoteDialogOpen,
            setIsOpen: setIsAnecdoteDialogOpen,
            anecdoteText: currentAnecdoteText,
            setAnecdoteText: setCurrentAnecdoteText,
            anecdoteType: currentAnecdoteType,
            setAnecdoteType: setCurrentAnecdoteType,
            mediaUrl: currentAnecdoteMediaUrl,
            setMediaUrl: setCurrentAnecdoteMediaUrl,
            uploadedFileName,
            isUploadingMedia,
            onMediaFileSelected: handleMediaFileSelected,
            onSave: handleSaveAnecdote,
            title: dialogTitle
          })
        )
    )
  );
};

export default GamePage;