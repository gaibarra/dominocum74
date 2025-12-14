import { saveGame } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { convertToUTC } from '@/lib/dateUtils';
import { validateAndParseScore, validateHandScores } from './scoreUtils';

export const processAddHand = async (game, tableId, scoresInput, fetchGameAndPlayersData, toast) => {
  const scorePair1 = validateAndParseScore(scoresInput.pair1);
  const scorePair2 = validateAndParseScore(scoresInput.pair2);

  if (!validateHandScores(scoresInput, scorePair1, scorePair2, toast)) {
    return { success: false, updatedGame: game, tableId };
  }

  const updatedGame = JSON.parse(JSON.stringify(game));
  const tableIndex = updatedGame.tables.findIndex(t => t.id === tableId);
  if (tableIndex === -1) {
    toast({ title: "Error", description: "Mesa no encontrada.", variant: "destructive" });
    return { success: false, updatedGame, tableId };
  }
  
  const currentTable = updatedGame.tables[tableIndex];
  const newHandNumber = (currentTable.hands?.length || 0) + 1;
  const now = convertToUTC();
  let previousHandEndTime = currentTable.hands?.length > 0 ? currentTable.hands[currentTable.hands.length - 1].end_time : currentTable.created_at || now;

  if (currentTable.hands?.length > 0) {
      const lastHand = currentTable.hands[currentTable.hands.length - 1];
      if (!lastHand.end_time) {
          lastHand.end_time = now;
          lastHand.duration_seconds = Math.floor((new Date(now).getTime() - new Date(lastHand.start_time).getTime()) / 1000);
      }
      previousHandEndTime = lastHand.end_time;
  }
  
  currentTable.hands.push({ 
      id: `temp-hand-${uuidv4()}`, 
      pair_1_score: scorePair1, 
      pair_2_score: scorePair2, 
      hand_number: newHandNumber,
      start_time: previousHandEndTime, 
      end_time: null, 
      duration_seconds: null 
  });
  
  currentTable.pairs[0].score = (currentTable.pairs[0].score || 0) + scorePair1;
  currentTable.pairs[1].score = (currentTable.pairs[1].score || 0) + scorePair2;

  // Nota: ya no cerramos automáticamente la partida ni incrementamos juegos ganados.
  // El cierre ahora se confirma vía un modal antes de marcar como finalizada.

  const gameSavedId = await saveGame(updatedGame);
  if (gameSavedId) {
    await fetchGameAndPlayersData(); 
    toast({ title: "Mano Agregada", description: `Puntajes registrados para la mesa ${currentTable.table_number}.` });
    return { success: true, updatedGame, tableId };
  } else {
    toast({ title: "Error", description: "No se pudo guardar la mano. Intenta de nuevo.", variant: "destructive" });
    await fetchGameAndPlayersData(); 
    return { success: false, updatedGame, tableId };
  }
};