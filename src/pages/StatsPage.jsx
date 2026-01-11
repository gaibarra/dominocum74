// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import OverallStatsCards from "@/components/stats/OverallStatsCards";
import PlayerStatsTable from "@/components/stats/PlayerStatsTable";
import PairStatsTable from "@/components/stats/PairStatsTable";
import { useToast } from "@/components/ui/use-toast";
import { getStatsOverview } from "@/lib/stats";
import { buildStatsControlFigures } from "@/lib/integrity";

const sortNumeric = (field, direction) => (a, b) => {
  const av = Number(a[field] ?? 0);
  const bv = Number(b[field] ?? 0);
  if (av === bv) return 0;
  const comparison = av > bv ? 1 : -1;
  return direction === "asc" ? comparison : -comparison;
};

const StatsPage = () => {
  const { toast } = useToast();
  const emptyStats = { totals: { totalGames: 0, totalHands: 0 }, players: [], pairs: [] };
  const [stats, setStats] = useState(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [playerSort, setPlayerSort] = useState({ field: "wins", direction: "desc" });
  const [pairSort, setPairSort] = useState({ field: "wins", direction: "desc" });
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setStats(emptyStats); // reset UI accumulators before fetching fresh data
    try {
      const data = await getStatsOverview();
      setStats(data || emptyStats);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      toast({
        title: "No pudimos cargar las estadísticas",
        description: error.message || "Intenta nuevamente en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handlePlayerSort = (field) => {
    setPlayerSort((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === "desc" ? "asc" : "desc" };
      }
      return { field, direction: field === "nickname" ? "asc" : "desc" };
    });
  };

  const handlePairSort = (field) => {
    setPairSort((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === "desc" ? "asc" : "desc" };
      }
      return { field, direction: field === "pairLabel" ? "asc" : "desc" };
    });
  };

  const playerLookup = useMemo(() => {
    const map = new Map();
    (stats.players || []).forEach((player) => map.set(player.id, player));
    return map;
  }, [stats.players]);

  const sortedPlayers = useMemo(() => {
    const items = [...(stats.players || [])].map((p) => ({
      ...p,
      losses: Math.max((p.gamesPlayed || 0) - (p.wins || 0), 0),
    }));
    if (!items.length) return items;
    const { field, direction } = playerSort;
    if (field === "nickname") {
      items.sort((a, b) => (direction === "asc" ? a.nickname.localeCompare(b.nickname) : b.nickname.localeCompare(a.nickname)));
      return items;
    }
    items.sort(sortNumeric(field, direction));
    return items;
  }, [stats.players, playerSort]);

  const sortedPairs = useMemo(() => {
    const items = [...(stats.pairs || [])];
    if (!items.length) return items;
    const { field, direction } = pairSort;
    if (field === "pairLabel") {
      items.sort((a, b) => {
        const aLabel = a.playerIds.map((id) => playerLookup.get(id)?.nickname || "?").join(" & ");
        const bLabel = b.playerIds.map((id) => playerLookup.get(id)?.nickname || "?").join(" & ");
        return direction === "asc" ? aLabel.localeCompare(bLabel) : bLabel.localeCompare(aLabel);
      });
      return items;
    }
    items.sort(sortNumeric(field, direction));
    return items;
  }, [stats.pairs, pairSort, playerLookup]);

  const topWinner = useMemo(() => {
    if (!stats.players?.length) return null;
    // Prioritize players with the most wins; break ties with games played and minutes for stability.
    return [...stats.players]
      .sort((a, b) => (b.wins || 0) - (a.wins || 0) || (b.gamesPlayed || 0) - (a.gamesPlayed || 0) || (b.minutesPlayed || 0) - (a.minutesPlayed || 0))[0];
  }, [stats.players]);

  const formattedUpdatedAt = useMemo(() => {
    if (!lastUpdated) return "";
    try {
      return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastUpdated));
    } catch {
      return lastUpdated;
    }
  }, [lastUpdated]);

  const statsControlFigures = useMemo(() => buildStatsControlFigures(stats), [stats]);
  const metricFormatter = useMemo(() => new Intl.NumberFormat("es-MX"), []);
  const formatMetric = useCallback((value) => metricFormatter.format(Math.round(value || 0)), [metricFormatter]);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Panel Analítico</p>
          <h1 className="gradient-text">Estadísticas de Dominó CUM 74</h1>
          <p className="text-sm text-muted-foreground">Resumen consolidado de todas las veladas registradas.</p>
        </div>
        <Button variant="outline" onClick={loadStats} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Recargar datos
        </Button>
      </motion.div>

      <OverallStatsCards
        totalGames={stats.totals?.totalGames || 0}
        totalHands={stats.totals?.totalHands || 0}
        topWinner={topWinner}
        lastUpdatedLabel={formattedUpdatedAt}
      />

      {!!stats.players?.length && (
        <Card className="mb-8 glassmorphism-card border border-dashed border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle>Cifras de control</CardTitle>
            <p className="text-xs text-muted-foreground">
              Comprueba que este código coincida con el impreso en los PDFs de cada velada.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Partidas registradas</p>
              <p className="text-lg font-semibold">{formatMetric(statsControlFigures.totalGames)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Manos registradas</p>
              <p className="text-lg font-semibold">{formatMetric(statsControlFigures.totalHands)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Jugadores en ranking</p>
              <p className="text-lg font-semibold">{formatMetric(statsControlFigures.playersTracked)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Minutos presentes</p>
              <p className="text-lg font-semibold">{`${formatMetric(statsControlFigures.totalMinutesPresent)} min`}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Minutos en mesa</p>
              <p className="text-lg font-semibold">{`${formatMetric(statsControlFigures.totalMinutesPlaying)} min`}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Código de control</p>
              <p className="text-xl font-mono tracking-[0.3em] text-primary">{statsControlFigures.controlCode}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="mx-auto mb-8 grid w-full grid-cols-2 md:w-1/2">
            <TabsTrigger value="players">Por jugador</TabsTrigger>
            <TabsTrigger value="pairs">Por pareja</TabsTrigger>
          </TabsList>
          <TabsContent value="players">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <Card className="glassmorphism-card">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Ranking general</CardTitle>
                  {formattedUpdatedAt && (
                    <span className="text-xs text-muted-foreground">Actualizado {formattedUpdatedAt}</span>
                  )}
                </CardHeader>
                <CardContent>
                  <PlayerStatsTable
                    playerStats={sortedPlayers}
                    sortConfig={playerSort}
                    onSortChange={handlePlayerSort}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          <TabsContent value="pairs">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <Card className="glassmorphism-card">
                <CardHeader>
                  <CardTitle>Sinergias destacadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <PairStatsTable
                    pairStats={sortedPairs}
                    sortConfig={pairSort}
                    onSortChange={handlePairSort}
                    getPlayerInfo={(id) => playerLookup.get(id) || { nickname: "Sin registro", photo: "" }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default StatsPage;
