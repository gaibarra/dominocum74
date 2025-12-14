import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast.js";
import { getGamesLight as getGames, deleteGame as deleteGameFromDB, updateGameStatus, getActiveGame } from '@/lib/storage';

export const useDashboardState = () => {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGame, setActiveGameLocal] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(null); 
  const { toast } = useToast();

  const fetchGamesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const gamesData = await getGames();
      const currentActiveGame = await getActiveGame();
      setGames(gamesData || []);
      setActiveGameLocal(currentActiveGame);
    } catch (err) {
      console.error("Error fetching games:", err);
      setError(err.message);
      toast({
        title: "Error al Cargar Veladas",
        description: "No se pudieron cargar las veladas. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGamesData();
  }, [fetchGamesData]);

  const handleDeleteGame = async (gameId) => {
    try {
      await deleteGameFromDB(gameId);
      setGames(prevGames => prevGames.filter(game => game.id !== gameId));
      toast({
        title: "Velada Eliminada",
        description: "La velada ha sido eliminada exitosamente.",
        className: "bg-green-500 text-white",
      });
      if (activeGame && activeGame.id === gameId) {
        setActiveGameLocal(null);
      }
    } catch (error) {
      console.error("Error deleting game:", error);
      toast({
        title: "Error al Eliminar",
        description: "No se pudo eliminar la velada. " + error.message,
        variant: "destructive",
      });
    }
  };
  
  const handleGameStatusChange = async (gameId, newStatus) => {
    setIsUpdatingStatus(gameId);
    try {
      const updatedGame = await updateGameStatus(gameId, newStatus);
      if (updatedGame) {
        toast({
          title: `Velada ${newStatus.toLowerCase()}`,
          description: `La velada ha sido marcada como ${newStatus.toLowerCase()}.`,
          className: "bg-blue-500 text-white"
        });
        await fetchGamesData(); 
      } else {
        throw new Error("No se pudo actualizar el estado.");
      }
    } catch (err) {
      console.error("Error updating game status:", err);
      toast({
        title: "Error al Actualizar Estado",
        description: `No se pudo actualizar el estado: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  return {
    games,
    isLoading,
    error,
    activeGame,
    isUpdatingStatus,
    fetchGamesData,
    handleDeleteGame,
    handleGameStatusChange,
    toast,
  };
};