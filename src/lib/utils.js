import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function validateAndParseScore(scoreStr) {
  if (scoreStr === null || scoreStr === undefined || String(scoreStr).trim() === "") {
    return 0; 
  }
  const score = parseInt(String(scoreStr).trim(), 10);
  if (isNaN(score)) {
    return null; 
  }
  return score;
}