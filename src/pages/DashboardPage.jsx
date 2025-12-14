import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, PlusCircle, History, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ActiveGameCard from '@/components/dashboard/ActiveGameCard';
import GameList from '@/components/dashboard/GameList';
import { useDashboardState } from '@/components/dashboard/hooks/useDashboardState';

const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    games,
    isLoading,
    error,
    activeGame,
    isUpdatingStatus,
    fetchGamesData,
    handleDeleteGame,
    handleGameStatusChange,
    toast,
  } = useDashboardState();

  const handleContinueGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const handleStartNewGame = async () => {
    if (activeGame) {
      toast({
        title: "Velada en Curso Existente",
        description: `Ya hay una velada "${activeGame.summary || activeGame.date}" en curso. Debes finalizarla o cancelarla antes de iniciar una nueva.`,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    navigate('/new-game');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white">
        <Loader2 className="h-16 w-16 animate-spin text-sky-400 mb-6" />
        <p className="text-2xl font-semibold tracking-tight">Cargando Veladas...</p>
        <p className="text-slate-400">Un momento, por favor.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 text-center bg-red-50 dark:bg-red-900/10">
        <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400 mb-6" />
        <h1 className="text-3xl font-bold text-red-700 dark:text-red-300 mb-2">Error de Carga</h1>
        <p className="text-red-600 dark:text-red-400 mb-8 max-w-md">{error}</p>
        <Button onClick={fetchGamesData} variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">
          <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader onStartNewGame={handleStartNewGame} />

      {activeGame && (
        <ActiveGameCard activeGame={activeGame} onContinueGame={handleContinueGame} />
      )}

      {games.length === 0 && !activeGame ? (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-16"
        >
          <History className="mx-auto h-20 w-20 text-slate-400 dark:text-slate-600 mb-6" />
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No hay veladas registradas todavía.</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">¡Crea tu primera velada para empezar a registrar tus partidas de dominó!</p>
          <Button onClick={handleStartNewGame} size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-md">
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Primera Velada
          </Button>
        </motion.div>
      ) : (
        <GameList
          games={games}
          activeGame={activeGame}
          isUpdatingStatus={isUpdatingStatus}
          onContinueGame={handleContinueGame}
          onDeleteGame={handleDeleteGame}
          onGameStatusChange={handleGameStatusChange}
        />
      )}
    </div>
  );
};

export default DashboardPage;