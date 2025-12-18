import { useCallback, useEffect, useState } from 'react';
import { getStatsOverview } from '@/lib/stats';
import { getGames, getActiveGame } from '@/lib/storage';

const DEFAULT_STATE = {
  stats: null,
  games: [],
  activeGame: null,
  isLoading: true,
  error: null,
};

const SAFE_LIMIT = 6;

export const useHomeData = () => {
  const [state, setState] = useState(DEFAULT_STATE);

  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [statsResponse, gamesResponse, activeGameResponse] = await Promise.all([
        getStatsOverview().catch(() => null),
        getGames({ limit: SAFE_LIMIT, offset: 0 }).catch(() => []),
        getActiveGame().catch(() => null),
      ]);

      setState({
        stats: statsResponse,
        games: Array.isArray(gamesResponse) ? gamesResponse : [],
        activeGame: activeGameResponse,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'No pudimos cargar la información general.',
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...state,
    refresh: loadData,
  };
};

export default useHomeData;
