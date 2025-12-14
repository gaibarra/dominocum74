import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const EditHandDialog = ({ isOpen, setIsOpen, hand, tableNumber, onSave }) => {
  const { toast } = useToast();
  const [pair1Score, setPair1Score] = useState('');
  const [pair2Score, setPair2Score] = useState('');

  useEffect(() => {
    if (hand) {
      setPair1Score(hand.pair_1_score !== undefined && hand.pair_1_score !== null ? String(hand.pair_1_score) : '0');
      setPair2Score(hand.pair_2_score !== undefined && hand.pair_2_score !== null ? String(hand.pair_2_score) : '0');
    } else {
      setPair1Score('');
      setPair2Score('');
    }
  }, [hand]);

  const handleSave = () => {
    const p1 = parseInt(pair1Score, 10);
    const p2 = parseInt(pair2Score, 10);

    if (isNaN(p1) || isNaN(p2)) {
      toast({ title: "Error", description: "Ambos puntajes deben ser números válidos.", variant: "destructive" });
      return;
    }
    if (p1 < 0 || p2 < 0) {
      toast({ title: "Error de puntaje", description: "Los puntajes no pueden ser negativos.", variant: "destructive" });
      return;
    }
    if (p1 > 0 && p2 > 0) {
      toast({ title: "Error de puntaje", description: "Una pareja debe tener 0 puntos si la otra puntúa.", variant: "destructive" });
      return;
    }
    if (p1 === 0 && p2 === 0 && (pair1Score !== "0" || pair2Score !== "0") && (pair1Score !== "" || pair2Score !== "")) {
       if (pair1Score === "" && pair2Score === "") {
         toast({ title: "Error de puntaje", description: "Al menos una pareja debe puntuar.", variant: "destructive" });
         return;
       }
    }

    onSave({ ...hand, pair_1_score: p1, pair_2_score: p2 });
    setIsOpen(false);
  };

  if (!hand) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] glassmorphism-dialog">
        <DialogHeader>
          <DialogTitle>Editar Mano {hand.hand_number} (Mesa {tableNumber || hand.tableNumber})</DialogTitle>
          <DialogDescription>
            Modifica los puntajes para esta mano. Recuerda que una pareja debe tener 0 si la otra puntúa.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="edit-pair1-score">Puntos Pareja 1</Label>
            <Input
              id="edit-pair1-score"
              type="number"
              min="0"
              value={pair1Score}
              onChange={(e) => setPair1Score(e.target.value)}
              className="neumorphism-input-inset"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="edit-pair2-score">Puntos Pareja 2</Label>
            <Input
              id="edit-pair2-score"
              type="number"
              min="0"
              value={pair2Score}
              onChange={(e) => setPair2Score(e.target.value)}
              className="neumorphism-input-inset"
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="neumorphism-button">Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditHandDialog;