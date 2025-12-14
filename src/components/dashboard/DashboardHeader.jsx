import React from 'react';
import { Button } from "@/components/ui/button.jsx";
import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardHeader = ({ onStartNewGame }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex flex-col md:flex-row justify-between items-center mb-10 p-6 bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-slate-800 rounded-xl shadow-2xl text-white"
    >
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Panel de Veladas</h1>
        <p className="text-blue-100 dark:text-slate-300 mt-1">Administra y revive tus mejores momentos de dominó.</p>
      </div>
      <Button 
        onClick={onStartNewGame} 
        size="lg" 
        className="mt-4 md:mt-0 bg-white text-primary hover:bg-blue-50 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 shadow-lg transition-transform transform hover:scale-105"
      >
        <PlusCircle className="mr-2 h-5 w-5" /> Nueva Velada
      </Button>
    </motion.div>
  );
};

export default DashboardHeader;