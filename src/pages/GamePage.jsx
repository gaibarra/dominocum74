// src/pages/GamePage.jsx
import React, { useState, useCallback, useMemo, Suspense, lazy } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameData } from "@/components/game/game_page_components/useGameData";
import { useTableManagement } from "@/components/game/game_page_components/useTableManagement";
import { useHandManagement } from "@/components/game/game_page_components/useHandManagement";
import { useAnecdotes } from "@/components/game/game_page_components/useAnecdotes";
import { useAttendance } from "@/components/game/game_page_components/useAttendance";
import { useGameRealtime } from "@/components/game/game_page_components/useGameRealtime";
import { normalizeHand, normalizeTable, normalizeAnecdote } from "@/lib/normalizers";
// @ts-ignore
import AttendancePanel from "@/components/game/AttendancePanel";
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

  const presentCount = React.useMemo(() => {
    if (!Array.isArray(attendance)) return 0;
    const ids = new Set(attendance.filter((/** @type {any} */ a) => a.check_in_time && !a.check_out_time).map((/** @type {any} */ a) => a.player_id));
    return ids.size;
  }, [attendance]);
  const benchCount = Array.isArray(benchPlayers) ? benchPlayers.length : 0;

  // marca una mesa como finalizada (persistente): incrementa contador y libera jugadores a Banca
  const handleFinishTable = useCallback(async (tableId) => {
    const table = game?.tables?.find((/** @type {any} */ t) => t.id === tableId);
    if (!table || table.partidaFinished) return;
    const p1 = (table.hands||[]).reduce((s, h) => s + (h.pair_1_score || 0), 0);
    const p2 = (table.hands||[]).reduce((s, h) => s + (h.pair_2_score || 0), 0);
    const toWin = table.points_to_win_partida || 100;
    let inc1 = 0, inc2 = 0;
    if (p1 >= toWin || p2 >= toWin) {
      if (p1 > p2) inc1 = 1; else if (p2 > p1) inc2 = 1;
    }
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
      React.createElement(AttendancePanel, {
        id: "attendance",
        game,
        playersData,
        attendance,
        benchPlayers,
        onCheckIn,
        onCheckOut,
        onBackfillNextDay,
        selectedPlayersInGame
      }),

      React.createElement(
        "div",
        { className: "my-8 p-6 bg-card/80 backdrop-blur-sm shadow-xl rounded-xl border border-border/50" },
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