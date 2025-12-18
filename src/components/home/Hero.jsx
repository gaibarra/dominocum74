import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Users2 } from "lucide-react";

const formatDateTime = (input) => {
  if (!input) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(input));
  } catch {
    return input;
  }
};

const formatNumber = (value) => {
  const numeric = typeof value === 'number' ? value : Number(value) || 0;
  return numeric.toLocaleString('es-MX');
};

const Hero = ({ stats, activeGame, fallbackGame, isLoading }) => {
  const totals = {
    games: stats?.totals?.totalGames ?? 0,
    hands: stats?.totals?.totalHands ?? 0,
    players: stats?.players?.length ?? 0,
  };

  const heroStats = [
    { label: "Veladas registradas", value: formatNumber(totals.games) },
    { label: "Manos jugadas", value: formatNumber(totals.hands) },
    { label: "Jugadores activos", value: formatNumber(totals.players) },
  ];

  const topPlayers = (stats?.players || []).slice(0, 3);
  const spotlightGame = activeGame || fallbackGame || null;
  const tablesCount = spotlightGame?.tables?.length || 0;
  const handsCount = spotlightGame?.tables?.reduce((sum, table) => sum + (table.hands?.length || 0), 0) || 0;
  const primaryCtaPath = activeGame ? `/game/${activeGame.id}` : "/dashboard";
  const secondaryCtaPath = "/new-game";

  return (
    <section className="relative overflow-hidden bg-[#040615] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1b2f9b,_transparent_55%)] opacity-70" />
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(120deg, rgba(8,24,68,0.9), rgba(3,13,33,0.95))" }} />
      <div className="container mx-auto px-4 relative z-10 pt-24 pb-16 md:pt-32 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 text-sm uppercase tracking-[0.2em] text-blue-200">
              Dominó CUM 74
            </span>
            <h1 className="mt-6 text-4xl md:text-5xl font-semibold leading-tight">
              La mesa vuelve a vibrar cada martes.
              <span className="block text-blue-200">Organiza, narra y comparte la velada en tiempo real.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-200 max-w-xl">
              Centraliza la asistencia, arma mesas dinámicas, registra cada mano y comparte estadísticas impresionantes sin mover más que un par de fichas.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-base bg-blue-400 text-slate-950 hover:bg-blue-300">
                <Link to={primaryCtaPath}>
                  {activeGame ? "Seguir velada" : "Ir al dashboard"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base border-white/40 text-white hover:bg-white/10">
                <Link to={secondaryCtaPath}>Crear nueva velada</Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
                  <div className="text-3xl font-semibold text-blue-200">{stat.value}</div>
                  <div className="text-sm text-slate-300 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="rounded-3xl bg-white/5 border border-white/15 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between text-sm text-blue-100">
                <span>{activeGame ? "Velada en curso" : "Próximo encuentro"}</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-100 gap-2">
                  <Trophy className="h-4 w-4" /> Ranking oficial
                </span>
              </div>
              <div className="mt-4 text-2xl font-semibold">
                {spotlightGame?.summary || spotlightGame?.location_name || "Aún sin programar"}
              </div>
              <p className="text-blue-100 mt-2">{spotlightGame ? formatDateTime(spotlightGame.date) : "Registra la próxima fecha"}</p>
              <p className="text-sm text-slate-200">{spotlightGame?.location_details || "Club Universitario de Médicos"}</p>
              <div className="mt-6 flex items-center justify-between text-sm text-slate-200">
                <span className="flex items-center gap-2"><Users2 className="h-4 w-4" /> Mesas confirmadas</span>
                <span className="text-xl font-semibold text-white">{tablesCount}</span>
              </div>
              {spotlightGame && (
                <p className="mt-4 text-xs text-blue-100">
                  {handsCount} manos registradas · {spotlightGame.status}
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-[#0b1124] border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Top jugadores · Última velada</p>
                  <p className="text-lg font-semibold text-white mt-1">{spotlightGame?.summary || "Registro en tiempo real"}</p>
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-100 text-xs uppercase tracking-wide">
                  Modo en vivo
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {(isLoading ? Array.from({ length: 3 }) : topPlayers).map((player, index) => (
                  <div key={player?.id || index} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{player?.nickname || "Sin datos"}</p>
                      <p className="text-xs text-slate-300">{player ? `${player.wins} victorias` : "Cargando"}</p>
                    </div>
                    <span className="text-blue-200 font-semibold">
                      {player ? `${player.totalPoints} pts` : "--"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;