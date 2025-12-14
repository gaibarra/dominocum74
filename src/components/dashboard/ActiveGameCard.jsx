import React from 'react';
import { Button } from "@/components/ui/button.jsx";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card.jsx";
import { Play, Trophy } from 'lucide-react';
import GameStatusBadge from '@/components/dashboard/GameStatusBadge';
import { motion } from 'framer-motion';

const ActiveGameCard = ({ activeGame, onContinueGame }) => {
  if (!activeGame) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="mb-10"
    >
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl border-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center">
            <Trophy className="mr-3 h-7 w-7 text-yellow-300" />
            Velada en Curso Activa
          </CardTitle>
          <GameStatusBadge status={activeGame.status} />
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold mb-1">{activeGame.summary || `Velada del ${activeGame.date}`}</p>
          <p className="text-sm text-green-100">Iniciada el: {activeGame.date}</p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={() => onContinueGame(activeGame.id)} 
            className="bg-white text-green-600 hover:bg-green-50 shadow-md transition-transform transform hover:scale-105"
          >
            <Play className="mr-2 h-5 w-5" /> Continuar Velada
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ActiveGameCard;