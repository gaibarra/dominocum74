import React, { useMemo } from "react";
import Hero from "@/components/home/Hero";
import Services from "@/components/home/Services";
import About from "@/components/home/About";
import Testimonials from "@/components/home/Testimonials";
import LatestPosts from "@/components/home/LatestPosts";
import CTA from "@/components/home/CTA";
import { useHomeData } from "@/components/home/hooks/useHomeData";

const HomePage = () => {
  const { stats, games, activeGame, isLoading } = useHomeData();

  const recentGames = useMemo(() => (games || []).slice(0, 4), [games]);
  const featuredGame = activeGame || games?.find((game) => game.status !== "Cancelada") || null;
  const latestAnecdotes = useMemo(() => {
    const entries = [];
    (games || []).forEach((game) => {
      (game.anecdotes || []).forEach((anecdote) => {
        entries.push({
          ...anecdote,
          gameId: game.id,
          gameSummary: game.summary,
          gameDate: game.date,
        });
      });
    });
    return entries
      .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
      .slice(0, 3);
  }, [games]);

  return (
    <main>
      <Hero stats={stats} activeGame={activeGame} fallbackGame={featuredGame} isLoading={isLoading} />
      <Services stats={stats} games={recentGames} isLoading={isLoading} />
      <About stats={stats} games={games} />
      <Testimonials anecdotes={latestAnecdotes} />
      <LatestPosts games={recentGames} />
      <CTA activeGame={activeGame} fallbackGame={featuredGame} />
    </main>
  );
};

export default HomePage;