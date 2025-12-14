import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

const TableConfigCard = ({ table, tableIndex, onRemoveTable, onPlayerSelect, availablePlayers, getSelectedPlayers, canRemove, disabled }) => {
  return (
    <Card className={`glassmorphism-card ${disabled ? 'opacity-50' : ''}`}>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Mesa {table.table_number}</CardTitle>
        {canRemove && (
          <Button variant="destructive" size="icon" onClick={() => onRemoveTable(table.id)} className="neumorphism-button" disabled={disabled}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {table.pairs.map((pair, pairIndex) => (
          <div key={pair.id || pairIndex} className="p-4 border rounded-lg bg-background/50">
            <h4 className="font-semibold mb-2 text-center">Pareja {pairIndex + 1}</h4>
            <div className="grid grid-cols-2 gap-4">
              {pair.players.map((_, playerIndexInPair) => (
                <div key={playerIndexInPair}>
                  <Label htmlFor={`p-${table.id}-${pair.id}-${playerIndexInPair}`}>Jugador {playerIndexInPair + 1}</Label>
                  <Select
                    value={table.pairs[pairIndex].players[playerIndexInPair] || ""}
                    onValueChange={(playerId) => onPlayerSelect(tableIndex, pairIndex, playerIndexInPair, playerId)}
                    disabled={disabled}
                  >
                    <SelectTrigger id={`p-${table.id}-${pair.id}-${playerIndexInPair}`}>
                      <SelectValue placeholder="Seleccionar jugador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null} disabled={disabled}>Vacío</SelectItem>
                      {availablePlayers
                        .filter(p => !getSelectedPlayers().has(p.id) || p.id === table.pairs[pairIndex].players[playerIndexInPair])
                        .map(p => (
                          <SelectItem key={p.id} value={p.id} disabled={disabled}>{p.nickname} ({p.name})</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TableConfigCard;