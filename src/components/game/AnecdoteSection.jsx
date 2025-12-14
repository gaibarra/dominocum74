import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AnecdoteCard from '@/components/game/AnecdoteCard';
import { Plus } from 'lucide-react';

const AnecdoteSection = ({
  anecdotes,
  onAddNewAnecdote,
  onEditAnecdote,
  onDeleteAnecdote,
  cardVariants,
  customDelay
}) => {
  return (
    <motion.div custom={customDelay} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-1">
      <Card className="glassmorphism-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Anécdotas</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="neumorphism-button" onClick={onAddNewAnecdote}>
                  <Plus className="mr-2 h-4 w-4" /> Nueva
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto pr-2">
          {(anecdotes && anecdotes.length > 0) ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {anecdotes.map((anecdote, index) => (
                <AnecdoteCard
                  key={anecdote.id || index}
                  anecdote={anecdote}
                  index={index}
                  onEdit={onEditAnecdote}
                  onDelete={onDeleteAnecdote}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay anécdotas todavía.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnecdoteSection;