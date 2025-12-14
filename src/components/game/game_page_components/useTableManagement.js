// components/game/game_page_components/useTableManagement.js
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { addTableToGameDB as addTableToGame } from '@/lib/storage'; 

export const useTableManagement = (game, fetchGameAndPlayersData) => {
  const { toast } = useToast();
  const [isAddTableDialogOpen, setIsAddTableDialogOpen] = useState(false);

  /**
   * Devuelve un Set con los playerIds que están en mesas
   * que *no* han sido finalizadas (games_won < games_to_win).
   */
  const getSelectedPlayersInGame = useCallback(() => {
    const selectedPlayerIds = new Set();
    if (!game?.tables) return selectedPlayerIds;

    const gamesToWinTable = game.games_to_win || 2; 
    game.tables.forEach(table => {
      const finished =
        table.games_won_pair1 >= gamesToWinTable ||
        table.games_won_pair2 >= gamesToWinTable;

      if (!finished) {
        table.pairs.forEach(pair => {
          pair.players.forEach(playerId => {
            if (playerId) selectedPlayerIds.add(playerId);
          });
        });
      }
    });

    return selectedPlayerIds;
  }, [game]);

  /**
   * Abre el diálogo SIEMPRE. 
   * Ya no hay tope de mesas: puedes crear tantas como quieras.
   */
  const handleOpenAddTableDialog = () => {
    setIsAddTableDialogOpen(true);
  };

  /**
   * Valida y guarda la nueva mesa en BD.
   */
  const handleSaveNewTable = async (newTableData) => {
    if (!game?.id) {
      toast({ title: "Error", description: "Velada no encontrada.", variant: "destructive" });
      return;
    }

    // Cada pareja debe tener exactamente 2 jugadores
    const invalidPair = newTableData.pairs.find(
      pair => pair.players.length !== 2 || pair.players.some(p => !p)
    );
    if (invalidPair) {
      toast({
        title: "Error de Configuración",
        description: "Cada pareja debe tener exactamente 2 jugadores seleccionados.",
        variant: "destructive"
      });
      return;
    }

    // No se repite ningún jugador dentro de la misma mesa
    const allPlayers = newTableData.pairs.flatMap(pair => pair.players);
    if (new Set(allPlayers).size !== allPlayers.length) {
      toast({
        title: "Error de Configuración",
        description: "Un jugador no puede repetirse en la misma mesa.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await addTableToGame(game.id, newTableData);
      if (result?.id) {
        toast({ title: "Mesa Agregada", description: `Mesa ${result.table_number} creada.` });
        await fetchGameAndPlayersData();
        setIsAddTableDialogOpen(false);
      } else {
        toast({
          title: "Error al Guardar Mesa",
          description: "No se pudo agregar la mesa. Intenta de nuevo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving new table:", error);
      toast({
        title: "Error Crítico",
        description: `No se pudo agregar la mesa: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  return {
    isAddTableDialogOpen,
    setIsAddTableDialogOpen,
    handleOpenAddTableDialog,
    handleSaveNewTable,
    getSelectedPlayersInGame
  };
};
