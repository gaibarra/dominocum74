import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { getGameById, getPlayers as fetchPlayersData } from '@/lib/storage';

export const useGameData = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [game, setGame] = useState(null);
  const [playersData, setPlayersData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGameAndPlayersData = useCallback(async () => {
    if (!gameId) {
      setError("ID de velada no proporcionado.");
      setIsLoading(false);
      toast({ title: "Error", description: "ID de velada no encontrado en la URL.", variant: "destructive" });
      navigate("/");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedGame = await getGameById(gameId);
      const fetchedPlayersArray = await fetchPlayersData();

      if (!fetchedGame) {
        setError(`Velada con ID ${gameId} no encontrada.`);
        toast({ title: "Velada no Encontrada", description: `No se pudo encontrar la velada. Verifique el ID e intente de nuevo.`, variant: "destructive" });
        setGame(null); 
        setIsLoading(false);
        return; 
      }
      
      setGame(fetchedGame);

      const playersDataObject = (fetchedPlayersArray || []).reduce((acc, player) => {
        acc[player.id] = player;
        return acc;
      }, {});
      setPlayersData(playersDataObject);
      
    } catch (err) {
      console.error("Error fetching game or players data:", err);
      setError(`Error al cargar datos: ${err.message}`);
      toast({ title: "Error de Carga", description: "Hubo un problema al cargar los datos de la velada o jugadores.", variant: "destructive" });
      setGame(null);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, navigate, toast]);

  useEffect(() => {
    fetchGameAndPlayersData();
  }, [fetchGameAndPlayersData]);

  return { game, setGame, playersData, isLoading, error, fetchGameAndPlayersData, gameId };
};