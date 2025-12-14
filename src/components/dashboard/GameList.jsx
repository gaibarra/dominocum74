import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GameCard from '@/components/dashboard/GameCard';

const GameList = ({ games, activeGame, isUpdatingStatus, onContinueGame, onDeleteGame, onGameStatusChange }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {games.map((game, index) => (
          <motion.div key={game.id} custom={index} initial="hidden" animate="visible" exit="hidden" variants={cardVariants}>
            <GameCard
              game={game}
              isActiveGame={activeGame && activeGame.id === game.id}
              isAnotherGameActive={activeGame && activeGame.id !== game.id}
              isUpdatingStatus={isUpdatingStatus === game.id}
              onContinueGame={onContinueGame}
              onDeleteGame={onDeleteGame}
              onGameStatusChange={onGameStatusChange}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GameList;