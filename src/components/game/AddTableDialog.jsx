import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const AddTableDialog = ({ isOpen, setIsOpen, availablePlayers, onSave, existingTableCount, selectedPlayersInGame }) => {
  const { toast } = useToast();
  const [pair1Player1, setPair1Player1] = useState(null);
  const [pair1Player2, setPair1Player2] = useState(null);
  const [pair2Player1, setPair2Player1] = useState(null);
  const [pair2Player2, setPair2Player2] = useState(null);

  const currentlySelectedInDialog = useMemo(() => {
    const selected = new Set();
    if (pair1Player1) selected.add(pair1Player1);
    if (pair1Player2) selected.add(pair1Player2);
    if (pair2Player1) selected.add(pair2Player1);
    if (pair2Player2) selected.add(pair2Player2);
    return selected;
  }, [pair1Player1, pair1Player2, pair2Player1, pair2Player2]);

  const resetForm = () => {
    setPair1Player1(null);
    setPair1Player2(null);
    setPair2Player1(null);
    setPair2Player2(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSave = () => {
    const players = [pair1Player1, pair1Player2, pair2Player1, pair2Player2];
    if (players.some(p => p === null || p === undefined)) {
      toast({ title: "Error", description: "Debes seleccionar 4 jugadores para la nueva mesa.", variant: "destructive" });
      return;
    }
    if (new Set(players).size !== 4) {
      toast({ title: "Error", description: "Los jugadores seleccionados para la nueva mesa deben ser únicos.", variant: "destructive" });
      return;
    }

    onSave({
      table_number: existingTableCount + 1,
      pairs: [
        { players: [pair1Player1, pair1Player2], score: 0 },
        { players: [pair2Player1, pair2Player2], score: 0 }
      ]
    });
    setIsOpen(false);
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
  };
  
  const renderPlayerSelect = (value, onChange, label, currentSelectionSlotId) => {
    // availablePlayers ya viene filtrado a: presentes y libres (bench)
    const allGamePlayersList = Array.isArray(availablePlayers) ? availablePlayers : [];

    const selectablePlayers = allGamePlayersList.filter(p => {
      if (p.id === currentSelectionSlotId) return true;
      if (currentlySelectedInDialog.has(p.id)) return false;
      if (selectedPlayersInGame instanceof Set && selectedPlayersInGame.has(p.id)) return false;
      return true; 
    });
    
    return (
      <div>
        <Label>{label}</Label>
        <Select value={value || ""} onValueChange={(val) => onChange(val === "null" ? null : val)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar jugador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Vacío</SelectItem>
            {selectablePlayers.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nickname} ({p.name})</SelectItem>
            ))}
            {selectablePlayers.length === 0 && !value && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No hay jugadores disponibles.</div>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] glassmorphism-dialog">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Mesa (Mesa {existingTableCount + 1})</DialogTitle>
          <DialogDescription>
            Selecciona 4 jugadores presentes (en lista) y libres. No se repiten y no deben estar en otra mesa activa.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="p-3 border rounded-lg bg-background/30 dark:bg-slate-800/50">
            <h4 className="font-semibold mb-2 text-center">Pareja 1</h4>
            <div className="grid grid-cols-2 gap-3">
              {renderPlayerSelect(pair1Player1, setPair1Player1, "Jugador 1", pair1Player1)}
              {renderPlayerSelect(pair1Player2, setPair1Player2, "Jugador 2", pair1Player2)}
            </div>
          </div>
          <div className="p-3 border rounded-lg bg-background/30 dark:bg-slate-800/50">
            <h4 className="font-semibold mb-2 text-center">Pareja 2</h4>
            <div className="grid grid-cols-2 gap-3">
              {renderPlayerSelect(pair2Player1, setPair2Player1, "Jugador 1", pair2Player1)}
              {renderPlayerSelect(pair2Player2, setPair2Player2, "Jugador 2", pair2Player2)}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="neumorphism-button">Guardar Mesa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTableDialog;