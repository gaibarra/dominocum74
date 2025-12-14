import { apiClient } from './apiClient';

export const getStatsOverview = async () => {
  try {
    const data = await apiClient.get('/stats');
    return data || { totals: { totalGames: 0, totalHands: 0 }, players: [], pairs: [] };
  } catch (error) {
    console.error('Error fetching stats overview:', error);
    throw error;
  }
};
