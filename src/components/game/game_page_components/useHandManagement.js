// components/game/game_page_components/useHandManagement.js
import { useState, useEffect, useCallback } from 'react';
import { addHandToTableDB as addHandToTable } from '@/lib/storage';
import { processEditHand } from './handManagement/editHandLogic';

export const useHandManagement = (
  game,
  setGame,
  fetchGameAndPlayersData,
  toast
) => {
  const [currentHandScores, setCurrentHandScores] = useState({});
  const [editingHand, setEditingHand] = useState(null);
  const [isEditHandDialogOpen, setIsEditHandDialogOpen] = useState(false);
  const [currentEditingTableId, setCurrentEditingTableId] = useState(null);

  // Inicializa inputs por mesa
  const initializeScoresForTables = useCallback(() => {
    if (!game?.tables) return;
    setCurrentHandScores(prev => {
      const next = { ...prev };
      game.tables.forEach(table => {
  if (next[table.id] === null || next[table.id] === undefined) {
          next[table.id] = { pair1: "", pair2: "" };
        }
      });
      return next;
    });
  }, [game?.tables]);

  useEffect(() => {
    initializeScoresForTables();
  }, [initializeScoresForTables]);

  // Captura cambios en inputs
  const handleScoreChange = useCallback((tableId, pairKey, value) => {
    // Permitir solo dígitos; mantener como string para permitir multi-dígito sin bloqueos
    const cleaned = String(value).replace(/[^0-9]/g, '');
    setCurrentHandScores(prev => {
      const prevForTable = prev[tableId] || { pair1: "", pair2: "" };
      const nextForTable = { ...prevForTable, [pairKey]: cleaned };
      return { ...prev, [tableId]: nextForTable };
    });
  }, []);

  // Agrega mano con validación 0–0 y optimistic update
  const handleAddHand = useCallback(async (tableId) => {
    if (!game?.tables) return;

    const input = currentHandScores[tableId] || { pair1: "", pair2: "" };
  let p1 = parseInt(input.pair1, 10) || 0;
  let p2 = parseInt(input.pair2, 10) || 0;

    // ✋ Validación: no permitir 0–0
    if (p1 === 0 && p2 === 0) {
      toast({
        title: "Error de puntuación",
        description: "Debes registrar al menos un punto en la mano.",
        variant: "destructive",
      });
      return;
    }

    // Regla: sólo una pareja puntúa por mano
    if (p1 > 0 && p2 > 0) {
      // Priorizar el último campo editado sería ideal; simple resolución: quedarnos con el mayor
      if (p1 >= p2) p2 = 0; else p1 = 0;
    }

    // Limpiar inputs de inmediato
    setCurrentHandScores(prev => ({
      ...prev,
      [tableId]: { pair1: "", pair2: "" }
    }));

    // Construir nueva mano y optimistic update
    const table = game.tables.find(t => t.id === tableId);
    if (!table) return;
    const tempId = `temp-hand-${tableId}-${Date.now()}`;
    const newHand = {
      id: tempId,
      hand_number: (table.hands?.length || 0) + 1,
      pair_1_score: p1,
      pair_2_score: p2,
      duration_seconds: null
    };
    setGame(prev => ({
      ...prev,
      tables: prev.tables.map(t => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          pairs: t.pairs.map((pair, idx) => ({
            ...pair,
            score: pair.score + (idx === 0 ? p1 : p2)
          })),
          hands: [...(t.hands || []), newHand]
        };
      })
    }));

    // Persistir en BD, y en fallo revertir con fetch completo
    try {
      const savedHand = await addHandToTable(game.id, tableId, newHand);
      setGame(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tables: prev.tables.map((t) => {
            if (t.id !== tableId) return t;
            let hands = (t.hands || []).filter((hand) => hand.id !== tempId);
            const existingIdx = hands.findIndex((hand) => hand.id === savedHand.id);
            if (existingIdx >= 0) {
              hands[existingIdx] = savedHand;
            } else {
              hands = [...hands, savedHand];
            }
            hands.sort((a, b) => (a.hand_number || 0) - (b.hand_number || 0));
            return { ...t, hands };
          }),
        };
      });
    } catch (err) {
      setGame(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tables: prev.tables.map((t) => {
            if (t.id !== tableId) return t;
            return {
              ...t,
              hands: (t.hands || []).filter((hand) => hand.id !== tempId),
            };
          }),
        };
      });
      toast({
        title: "Error al guardar mano",
        description: err.message,
        variant: "destructive"
      });
      fetchGameAndPlayersData();
    }
  }, [
    currentHandScores,
    game?.tables,
    game?.id,
    setGame,
    fetchGameAndPlayersData,
    toast
  ]);

  // Lógica de edición (sin cambios)
  const handleOpenEditHandDialog = useCallback((tableId, handId) => {
    if (!game?.tables) return;
    const table = game.tables.find(t => t.id === tableId);
    if (!table) return;
    const hand = table.hands.find(h => h.id === handId);
    if (!hand) return;
    setEditingHand({ ...hand, tableId });
    setCurrentEditingTableId(tableId);
    setIsEditHandDialogOpen(true);
  }, [game?.tables]);

  const handleSaveEditedHand = useCallback(async (editedHandData) => {
    if (!game) return;
    const success = await processEditHand(
      game,
      currentEditingTableId,
      editedHandData,
      fetchGameAndPlayersData,
      toast
    );
    if (success) {
      setIsEditHandDialogOpen(false);
      setEditingHand(null);
      setCurrentEditingTableId(null);
    }
  }, [
    game,
    currentEditingTableId,
    fetchGameAndPlayersData,
    toast
  ]);

  return {
    currentHandScores,
    handleScoreChange,
    handleAddHand,
    editingHand,
    isEditHandDialogOpen,
    setIsEditHandDialogOpen,
    handleOpenEditHandDialog,
    handleSaveEditedHand
  };
};
