import { updateHandInTableDB } from '@/lib/storage';
import { convertToUTC } from '@/lib/dateUtils';
import { validateAndParseScore, validateHandScores } from './scoreUtils';

export const processEditHand = async (game, currentEditingTableId, editedHandData, fetchGameAndPlayersData, toast) => {
    const p1 = validateAndParseScore(String(editedHandData.pair_1_score));
    const p2 = validateAndParseScore(String(editedHandData.pair_2_score));

    if (!validateHandScores({ pair1: String(editedHandData.pair_1_score), pair2: String(editedHandData.pair_2_score) }, p1, p2, toast)) {
        return false;
    }

    const updatedGame = JSON.parse(JSON.stringify(game));
    const tableIndex = updatedGame.tables.findIndex(t => t.id === currentEditingTableId);
    if (tableIndex === -1) {
        toast({ title: "Error", description: "Mesa no encontrada para editar mano.", variant: "destructive" });
        return false;
    }

    const currentTable = updatedGame.tables[tableIndex];
    const handIndex = currentTable.hands.findIndex(h => h.id === editedHandData.id);
    if (handIndex === -1) {
        toast({ title: "Error", description: "Mano no encontrada para editar.", variant: "destructive" });
        return false;
    }
    
    currentTable.hands[handIndex] = { ...currentTable.hands[handIndex], pair_1_score: p1, pair_2_score: p2, updated_at: convertToUTC() };
    
    currentTable.pairs[0].score = 0;
    currentTable.pairs[1].score = 0;
    currentTable.hands.forEach(h => {
      currentTable.pairs[0].score += (h.pair_1_score || 0);
      currentTable.pairs[1].score += (h.pair_2_score || 0);
    });

    if (currentTable.pairs[0].score >= (game.points_to_win_partida || 100) || currentTable.pairs[1].score >= (game.points_to_win_partida || 100)) {
        if (!currentTable.hands[handIndex].end_time) {
            const now = convertToUTC();
            currentTable.hands[handIndex].end_time = now;
            currentTable.hands[handIndex].duration_seconds = Math.floor((new Date(now).getTime() - new Date(currentTable.hands[handIndex].start_time).getTime()) / 1000);
        }
    }

    try {
      await updateHandInTableDB(editedHandData.id, {
        pair_1_score: p1,
        pair_2_score: p2,
      });
      await fetchGameAndPlayersData();
      toast({ title: "Mano Actualizada", description: "Los puntajes de la mano han sido actualizados." });
      return true;
    } catch (error) {
      console.error('Error updating hand', error);
      toast({ title: "Error", description: "No se pudo actualizar la mano. Intenta de nuevo.", variant: "destructive" });
      return false;
    }
};