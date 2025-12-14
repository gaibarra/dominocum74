import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useGameSetupForm = () => {
  const { toast } = useToast();
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const [gameSummary, setGameSummary] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationDetails, setLocationDetails] = useState("");

  const handleDateChange = (e) => setGameDate(e.target.value);
  const handleSummaryChange = (e) => setGameSummary(e.target.value);
  const handleLocationNameChange = (e) => setLocationName(e.target.value);
  const handleLocationDetailsChange = (e) => setLocationDetails(e.target.value);

  const validateForm = () => {
    if (!gameDate) {
      toast({
        title: "Error de Validación",
        description: "Por favor, selecciona una fecha para la velada.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return {
    gameDate,
    setGameDate: handleDateChange, 
    gameSummary,
    setGameSummary: handleSummaryChange,
    locationName,
    setLocationName: handleLocationNameChange,
    locationDetails,
    setLocationDetails: handleLocationDetailsChange,
    validateForm,
  };
};