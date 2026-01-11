import React from "react";
import { getActiveGame } from "@/lib/gameActions";
import { formatDateForDisplay } from "@/lib/dateUtils";

const ActiveVeladaContext = React.createContext({
  summary: null,
  setSummary: () => {},
  activeGame: null,
  setActiveGame: () => {},
  refreshActiveGame: async () => {},
  loading: false,
  error: null,
});

export const ActiveVeladaProvider = ({ children }) => {
  const [summary, setSummary] = React.useState(null);
  const [activeGame, setActiveGame] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const refreshActiveGame = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const game = await getActiveGame();
      setActiveGame(game);
      if (game) {
        setSummary((prev) => {
          const base = {
            id: game.id,
            title: `Velada del ${formatDateForDisplay(game.date)}`,
            status: game.status || "Sin estado",
            location: game.locationName || game.locationDetails || "Ubicación pendiente",
          };
          if (prev?.id === game.id) {
            return { ...prev, ...base };
          }
          return { ...base, present: 0, bench: 0 };
        });
      } else {
        setSummary(null);
      }
      return game;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshActiveGame();
  }, [refreshActiveGame]);

  const value = React.useMemo(
    () => ({
      summary,
      setSummary,
      activeGame,
      setActiveGame,
      refreshActiveGame,
      loading,
      error,
    }),
    [summary, activeGame, refreshActiveGame, loading, error]
  );

  return (
    <ActiveVeladaContext.Provider value={value}>
      {children}
    </ActiveVeladaContext.Provider>
  );
};

export const useActiveVelada = () => React.useContext(ActiveVeladaContext);
