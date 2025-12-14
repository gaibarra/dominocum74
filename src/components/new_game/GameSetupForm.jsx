import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, MapPin, ClipboardList } from "lucide-react";

const GameSetupForm = ({
  date,
  onDateChange,
  summary,
  onSummaryChange,
  locationName,
  onLocationNameChange,
  locationDetails,
  onLocationDetailsChange,
  disabled,
}) => {
  return (
    <Card className={`glassmorphism-card mb-8 ${disabled ? 'opacity-50' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center"><CalendarDays className="mr-2 h-6 w-6 text-primary" /> Información General</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="date">Fecha de la Velada</Label>
          <Input id="date" type="date" value={date} onChange={onDateChange} disabled={disabled} />
        </div>
        <div>
          <Label htmlFor="summary">Resumen de la Jornada (Opcional)</Label>
          <Textarea id="summary" value={summary} onChange={onSummaryChange} placeholder="Anotaciones generales, quién trajo las botanas, etc." disabled={disabled} />
        </div>
        <div>
          <Label htmlFor="locationName" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Lugar
          </Label>
          <Input
            id="locationName"
            type="text"
            value={locationName}
            onChange={onLocationNameChange}
            placeholder="Casa de Eugenio, Terraza del club, etc."
            disabled={disabled}
          />
        </div>
        <div>
          <Label htmlFor="locationDetails" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Preparativos / Indicaciones
          </Label>
          <Textarea
            id="locationDetails"
            value={locationDetails}
            onChange={onLocationDetailsChange}
            placeholder="Indicaciones de estacionamiento, qué llevar, horario sugerido, etc."
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GameSetupForm;