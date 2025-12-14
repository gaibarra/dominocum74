import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getPlayers, savePlayer, deletePlayer as deletePlayerStorage } from "@/lib/storage";
import PlayerForm from "@/components/players/PlayerForm";
import PlayerCard from "@/components/players/PlayerCard";
import { UserPlus, Users, Loader2, RefreshCw } from "lucide-react";

const PLAYERS_CACHE_KEY = "domino74::players";
const PLAYERS_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

const readPlayersCache = () => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(PLAYERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.data) || typeof parsed.timestamp !== "number") {
      return null;
    }
    if (Date.now() - parsed.timestamp > PLAYERS_CACHE_TTL_MS) {
      window.localStorage.removeItem(PLAYERS_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn("No se pudo leer el caché de jugadores:", error);
    return null;
  }
};

const persistPlayersCache = (players, timestamp = Date.now()) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      PLAYERS_CACHE_KEY,
      JSON.stringify({ data: players, timestamp })
    );
  } catch (error) {
    console.warn("No se pudo guardar el caché de jugadores:", error);
  }
};

const formatTimestampForDisplay = (timestamp) => {
  if (!timestamp) return "Sin sincronizar";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch (error) {
    console.warn("Formato de fecha inválido para la última sincronización:", error);
    return new Date(timestamp).toLocaleString();
  }
};

const PlayersPage = () => {
  const cachedSnapshot = useMemo(() => readPlayersCache(), []);
  const [players, setPlayers] = useState(() => cachedSnapshot?.data || []);
  const [isLoading, setIsLoading] = useState(() => !(cachedSnapshot?.data?.length));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(cachedSnapshot?.timestamp || null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  const playersCountRef = useRef(players.length);

  useEffect(() => {
    playersCountRef.current = players.length;
  }, [players.length]);

  const runFetchPlayers = useCallback(
    async ({ silent = false } = {}) => {
      if (silent && playersCountRef.current > 0) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setLoadError(null);

      try {
        const data = await getPlayers();
        setPlayers(data);
        const snapshotTimestamp = Date.now();
        setLastSyncedAt(snapshotTimestamp);
        persistPlayersCache(data, snapshotTimestamp);
      } catch (error) {
        console.error("Error cargando jugadores:", error);
        if (playersCountRef.current === 0) {
          setLoadError("No pudimos conectar con el servidor. Intenta recargar más tarde.");
        }
        if (!silent || playersCountRef.current === 0) {
          toast({
            title: "No pudimos actualizar la lista",
            description: "Revisa tu conexión e inténtalo nuevamente.",
            variant: "destructive",
          });
        }
      } finally {
        if (silent && playersCountRef.current > 0) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [toast]
  );

  useEffect(() => {
    runFetchPlayers({ silent: Boolean(cachedSnapshot?.data?.length) });
  }, [runFetchPlayers, cachedSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const shouldRefresh = () => {
      const staleThreshold = 5 * 60 * 1000; // 5 minutos
      if (!lastSyncedAt || Date.now() - lastSyncedAt > staleThreshold) {
        runFetchPlayers({ silent: true });
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        shouldRefresh();
      }
    };

    const handleOnline = () => shouldRefresh();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, [lastSyncedAt, runFetchPlayers]);

  const handleSavePlayer = async (playerData) => {
    const savedPlayer = await savePlayer(playerData);
    if (savedPlayer) {
      await runFetchPlayers();
      setIsFormOpen(false);
      setEditingPlayer(null);
      toast({
        title: "Éxito",
        description: `Jugador ${playerData.id ? 'actualizado' : 'agregado'} correctamente.`,
      });
    } else {
      toast({
        title: "Error",
        description: `No se pudo ${playerData.id ? 'actualizar' : 'agregar'} el jugador. Intenta de nuevo.`,
        variant: "destructive",
      });
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer({ ...player, playerType: player.playerType || player.player_type });
    setIsFormOpen(true);
  };

  const openDeleteConfirmDialog = (player) => {
    setPlayerToDelete(player);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeletePlayer = async () => {
    if (playerToDelete) {
      const success = await deletePlayerStorage(playerToDelete.id);
      if (success) {
        await runFetchPlayers();
        toast({
          title: "Jugador Eliminado",
          description: `${playerToDelete.name} ha sido eliminado.`,
        });
      } else {
        toast({
          title: "Error",
          description: `No se pudo eliminar a ${playerToDelete.name}. Intenta de nuevo.`,
          variant: "destructive",
        });
      }
    }
    setIsConfirmDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  const handleManualRefresh = () => runFetchPlayers();

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-8"
      >
        <h1 className="gradient-text">Gestión de Jugadores</h1>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingPlayer(null); }}>
          <DialogTrigger asChild>
            <Button className="neumorphism-button bg-primary hover:bg-primary/90 text-primary-foreground">
              <UserPlus className="mr-2 h-5 w-5" /> Agregar Jugador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glassmorphism-card">
            <DialogHeader>
              <DialogTitle>{editingPlayer ? "Editar Jugador" : "Agregar Nuevo Jugador"}</DialogTitle>
            </DialogHeader>
            <PlayerForm 
              player={editingPlayer} 
              onSave={handleSavePlayer} 
              onCancel={() => { setIsFormOpen(false); setEditingPlayer(null); }} 
            />
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-sm text-muted-foreground">
          Última sincronización: <span className="font-medium text-foreground">{formatTimestampForDisplay(lastSyncedAt)}</span>
        </div>
        <div className="flex items-center gap-3">
          {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : players.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center py-12"
        >
          <Users className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No hay jugadores registrados</h2>
          <p className="text-muted-foreground mb-6">¡Comienza agregando a tus amigos para llevar el control de las partidas!</p>
          <Button onClick={() => setIsFormOpen(true)} size="lg" className="neumorphism-button bg-primary hover:bg-primary/90 text-primary-foreground">
            <UserPlus className="mr-2 h-5 w-5" /> Agregar tu Primer Jugador
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {players.map((player, index) => (
            <PlayerCard 
              key={player.id}
              player={player}
              index={index}
              onEdit={handleEditPlayer}
              onDelete={openDeleteConfirmDialog}
            />
          ))}
        </div>
      )}
      
      <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md glassmorphism-card">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>¿Estás seguro de que quieres eliminar a {playerToDelete?.name} ({playerToDelete?.nickname})? Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={handleDeletePlayer}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default PlayersPage;