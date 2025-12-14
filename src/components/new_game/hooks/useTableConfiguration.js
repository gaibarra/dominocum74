import { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';

export const useTableConfiguration = (initialPlayers = []) => {
  const { toast } = useToast();
  const [tables, setTables] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState(initialPlayers);

  useEffect(() => {
    setAvailablePlayers(initialPlayers);
  }, [initialPlayers]);

  const handleAddTable = () => {
    if (tables.length < 3) {
      setTables([
        ...tables,
        {
          id: `temp-${uuidv4()}`,
          table_number: tables.length + 1,
          pairs: [
            { id: `temp-pair-${uuidv4()}`, players: [null, null], score: 0 },
            { id: `temp-pair-${uuidv4()}`, players: [null, null], score: 0 },
          ],
        },
      ]);
    } else {
      toast({ title: "Límite alcanzado", description: "Solo se pueden crear hasta 3 mesas.", variant: "destructive" });
    }
  };

  const handleRemoveTable = (tableId) => {
    const updatedTables = tables
      .filter(table => table.id !== tableId)
      .map((table, index) => ({ ...table, table_number: index + 1 }));
    setTables(updatedTables);
    if (updatedTables.length === 0) {
      toast({ title: "Mesas removidas", description: "La velada permanecerá como borrador hasta que agregues una mesa." });
    }
  };

  const handlePlayerSelect = (tableIndex, pairIndex, playerIndexInPair, playerId) => {
    const newTables = JSON.parse(JSON.stringify(tables)); 
    newTables[tableIndex].pairs[pairIndex].players[playerIndexInPair] = playerId === "null" ? null : playerId;
    setTables(newTables);
  };

  const getSelectedPlayers = () => {
    const selected = new Set();
    tables.forEach(table => {
      table.pairs.forEach(pair => {
        pair.players.forEach(playerId => {
          if (playerId) selected.add(playerId);
        });
      });
    });
    return selected;
  };

  const handleShufflePlayers = () => {
    const selectedPlayerIds = Array.from(getSelectedPlayers());
    if (selectedPlayerIds.length < 4 || selectedPlayerIds.length % 2 !== 0) {
      toast({ title: "Jugadores insuficientes", description: "Se necesitan al menos 4 jugadores seleccionados (y un número par) para barajar.", variant: "destructive" });
      return;
    }

    let shuffledPlayerIds = [...selectedPlayerIds].sort(() => 0.5 - Math.random());
    
    const newTables = tables.map(table => ({
      ...table,
      pairs: table.pairs.map(pair => ({
        ...pair,
        players: pair.players.map(() => shuffledPlayerIds.pop() || null)
      }))
    }));
    setTables(newTables.filter(table => table.pairs.some(pair => pair.players.some(p => p !== null)))); 
    toast({ title: "Jugadores Barajados", description: "Los jugadores han sido asignados aleatoriamente." });
  };
  
  const validateTables = () => {
    if (tables.length === 0) return true;
    for (const table of tables) {
      for (const pair of table.pairs) {
        if (pair.players.some(p => p === null)) {
          toast({ title: "Error de configuración", description: `Mesa ${table.table_number}: Todas las posiciones deben estar llenas.`, variant: "destructive" });
          return false;
        }
        const playersInPair = pair.players;
        if (playersInPair[0] === playersInPair[1]) {
           toast({ title: "Error de configuración", description: `Mesa ${table.table_number}, Pareja ${table.pairs.indexOf(pair)+1}: Un jugador no puede estar dos veces en la misma pareja.`, variant: "destructive" });
           return false;
        }
      }
      const playersInTable = table.pairs.flatMap(p => p.players);
      if (new Set(playersInTable).size !== playersInTable.length) {
        toast({ title: "Error de configuración", description: `Jugadores duplicados en la mesa ${table.table_number}.`, variant: "destructive" });
        return false;
      }
    }
    return true;
  };


  return {
    tables,
    setTables,
    availablePlayers,
    handleAddTable,
    handleRemoveTable,
    handlePlayerSelect,
    getSelectedPlayers,
    handleShufflePlayers,
    validateTables
  };
};