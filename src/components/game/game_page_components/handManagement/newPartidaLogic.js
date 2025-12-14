import { saveGame } from '@/lib/storage';
import { convertToUTC } from '@/lib/dateUtils';

export const processStartNewGameInTable = async (game, tableId, fetchGameAndPlayersData, toast) => {
    const updatedGame = JSON.parse(JSON.stringify(game));
    const tableIndex = updatedGame.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) {
        toast({ title: "Error", description: "Mesa no encontrada para iniciar nueva partida.", variant: "destructive" });
        return { success: false, tableId };
    }

    const currentTable = updatedGame.tables[tableIndex];
    const now = convertToUTC();
    if (currentTable.hands.length > 0) {
        const lastHand = currentTable.hands[currentTable.hands.length - 1];
        if (!lastHand.end_time) {
            lastHand.end_time = now;
            lastHand.duration_seconds = Math.floor((new Date(now).getTime() - new Date(lastHand.start_time).getTime()) / 1000);
        }
    }

    currentTable.pairs[0].score = 0;
    currentTable.pairs[1].score = 0;
    currentTable.hands = []; 
    currentTable.updated_at = now;

    const gameSavedId = await saveGame(updatedGame);
    if (gameSavedId) {
      await fetchGameAndPlayersData();
      toast({ title: "Nueva Partida Iniciada", description: `La mesa ${currentTable.table_number} está lista para una nueva partida.` });
      return { success: true, tableId };
    } else {
      toast({ title: "Error", description: "No se pudo iniciar la nueva partida en la mesa.", variant: "destructive" });
      return { success: false, tableId };
    }
};