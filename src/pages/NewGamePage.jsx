import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Shuffle, PlusCircle, Settings2, AlertTriangle, ArrowRight } from 'lucide-react';
import GameSetupForm from '@/components/new_game/GameSetupForm';
import TableConfigCard from '@/components/new_game/TableConfigCard';
import { useGameSetupForm } from '@/components/new_game/hooks/useGameSetupForm';
import { useTableConfiguration } from '@/components/new_game/hooks/useTableConfiguration';
import { getPlayers, saveGame, getActiveGame, checkInPlayer } from '@/lib/storage';
import { motion, AnimatePresence } from 'framer-motion';

const NewGamePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [playersData, setPlayersData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(true);
  const [activeGame, setActiveGame] = useState(null);

  const {
    gameDate,
    setGameDate,
    gameSummary,
    setGameSummary,
    locationName,
    setLocationName,
    locationDetails,
    setLocationDetails,
    validateForm,
  } = useGameSetupForm();
  const {
    tables,
    setTables,
    handleAddTable,
    handleRemoveTable,
    handlePlayerSelect,
    getSelectedPlayers,
    handleShufflePlayers,
    validateTables
  } = useTableConfiguration(playersData);

  useEffect(() => {
    const fetchPlayersAndActiveGame = async () => {
      setIsFetchingPlayers(true);
      try {
        const [players, currentActive] = await Promise.all([
          getPlayers(),
          getActiveGame().catch(() => null)
        ]);
        setPlayersData(players);
        setActiveGame(currentActive);
      } catch (error) {
        console.error('Error cargando jugadores o velada activa:', error);
        toast({ title: "Error", description: "No se pudieron cargar los jugadores.", variant: "destructive" });
      } finally {
        setIsFetchingPlayers(false);
      }
    };
    fetchPlayersAndActiveGame();
  }, [toast]);

  const registerInitialCheckins = async (gameId, configuredTables = []) => {
    if (!gameId || !Array.isArray(configuredTables)) return;
    const uniquePlayers = new Set();
    configuredTables.forEach(table => {
      (table?.pairs || []).forEach(pair => {
        (pair?.players || []).forEach(pid => {
          if (pid !== null && pid !== undefined) {
            uniquePlayers.add(pid);
          }
        });
      });
    });
    for (const playerId of uniquePlayers) {
      try {
        await checkInPlayer(gameId, playerId);
      } catch (err) {
        console.warn('No se pudo registrar asistencia inicial para el jugador', playerId, err?.message || err);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      toast({ title: "Error de Formulario", description: "Por favor, revisa la información general de la velada.", variant: "destructive" });
      return;
    }
    if (tables.length > 0 && !validateTables()) {
      toast({ title: "Error en Mesas", description: "Por favor, revisa la configuración de las mesas.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const currentActive = await getActiveGame();
      setActiveGame(currentActive);
      if (currentActive && currentActive.status === 'En curso') {
        toast({
          title: 'Hay una velada en curso',
          description: `Finaliza o cancela "${currentActive.summary || `Velada del ${currentActive.date}`}" antes de crear otra.`,
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      const hasConfiguredTables = tables.length > 0;
      const trimmedLocationName = locationName?.trim() || null;
      const trimmedLocationDetails = locationDetails?.trim() || null;
      const gameData = {
        date: gameDate,
        summary: gameSummary,
        location_name: trimmedLocationName,
        location_details: trimmedLocationDetails,
        status: hasConfiguredTables ? "En curso" : "Borrador",
        tables: hasConfiguredTables
          ? tables.map(table => ({
              ...table,
              pairs: table.pairs.map(pair => ({
                ...pair,
                players: pair.players.filter(p => p !== null)
              }))
            }))
          : [],
      };

      const newGame = await saveGame(gameData);
      if (newGame && newGame.id) {
        await registerInitialCheckins(newGame.id, gameData.tables);
        toast({
          title: tables.length > 0 ? "Velada Creada" : "Velada agendada",
          description: tables.length > 0
            ? "La nueva velada ha sido creada exitosamente."
            : "Guardamos el borrador para que todos consulten la información previa.",
        });
        navigate(`/game/${newGame.id}`);
      } else {
        throw new Error("La creación de la velada no devolvió un ID válido o falló.");
      }
    } catch (error) {
      console.error("Error al crear la velada:", error);
      toast({
        title: "Error al Crear Velada",
        description: error.message || "Ocurrió un problema al intentar guardar la velada. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingPlayers) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-foreground mb-2">
            Crear Nueva Velada de Dominó
          </h1>
          <p className="text-lg text-muted-foreground">
            Configura lugar, fecha y preparativos. Puedes dejar las mesas para después y guardar la velada como borrador.
          </p>
        </header>

        {activeGame && activeGame.status === 'En curso' && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">Ya hay una velada activa.</p>
                <p className="text-sm">Finaliza o cancela "{activeGame.summary || `Velada del ${activeGame.date}`}" antes de crear una nueva.</p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={() => navigate(`/game/${activeGame.id}`)} className="self-start sm:self-auto">
              <ArrowRight className="mr-2 h-4 w-4" /> Ir a la velada activa
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <GameSetupForm
            date={gameDate}
            onDateChange={setGameDate}
            summary={gameSummary}
            onSummaryChange={setGameSummary}
            locationName={locationName}
            onLocationNameChange={setLocationName}
            locationDetails={locationDetails}
            onLocationDetailsChange={setLocationDetails}
            disabled={isLoading}
          />

          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-border/30">
              <h2 className="text-2xl font-semibold text-foreground flex items-center">
                <Settings2 className="mr-3 h-7 w-7 text-primary" />
                Configuración de Mesas
              </h2>
              <div className="flex space-x-3 mt-4 sm:mt-0">
                <Button type="button" onClick={handleShufflePlayers} variant="outline" className="neumorphism-button-sm" disabled={isLoading || tables.length === 0}>
                  <Shuffle className="mr-2 h-4 w-4" /> Barajar Jugadores
                </Button>
                <Button type="button" onClick={handleAddTable} variant="outline" className="neumorphism-button-sm" disabled={isLoading || tables.length >= 3}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Mesa
                </Button>
              </div>
            </div>
            {tables.length === 0 && (
              <div className="border-2 border-dashed rounded-xl p-6 text-center text-muted-foreground bg-muted/20">
                <p className="font-semibold mb-1">Velada sin mesas (Borrador)</p>
                <p className="text-sm">
                  Guarda la información de lugar y preparativos ahora. Más tarde podrás regresar para asignar jugadores cuando lleguen y entonces iniciar la velada.
                </p>
              </div>
            )}
            <AnimatePresence>
              {tables.map((table, index) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  layout
                >
                  <TableConfigCard
                    table={table}
                    tableIndex={index}
                    onRemoveTable={handleRemoveTable}
                    onPlayerSelect={handlePlayerSelect}
                    availablePlayers={playersData}
                    getSelectedPlayers={getSelectedPlayers}
                    canRemove={tables.length > 0}
                    disabled={isLoading}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </section>

          <div className="flex justify-end pt-6 border-t border-border/30">
            <Button type="submit" className="neumorphism-button-primary w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar Velada
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default NewGamePage;