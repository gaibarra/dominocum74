import { validateAndParseScore as baseValidateAndParseScore } from '@/lib/utils';

export const validateAndParseScore = (scoreStr) => {
  return baseValidateAndParseScore(scoreStr);
};

export const validateHandScores = (scoresInput, scorePair1, scorePair2, toastInstance) => {
  if (!toastInstance || typeof toastInstance !== 'function') {
    console.error("validateHandScores: toastInstance is not a function or not provided.");
    
    return false;
  }

  if (scorePair1 === null || scorePair2 === null) {
    toastInstance({ title: "Error de Puntuación", description: "Por favor, ingrese puntajes válidos (números) para ambas parejas.", variant: "destructive" });
    return false;
  }
  if (scoresInput.pair1 === "" && scoresInput.pair2 === "") {
    toastInstance({ title: "Entrada Incompleta", description: "Por favor, ingrese puntajes para al menos una pareja.", variant: "destructive" });
    return false;
  }
  if (scorePair1 < 0 || scorePair2 < 0) {
    toastInstance({ title: "Error de Puntuación", description: "Los puntajes no pueden ser negativos.", variant: "destructive" });
    return false;
  }
  if (scorePair1 > 0 && scorePair2 > 0) {
    toastInstance({ title: "Error de Puntuación", description: "Una pareja debe tener 0 puntos si la otra puntúa.", variant: "destructive" });
    return false;
  }
  return true;
};