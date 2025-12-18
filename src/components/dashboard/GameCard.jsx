import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card.jsx";
import { ArrowRight, Trash2, Loader2, Play, CheckSquare, XSquare } from 'lucide-react';
import GameStatusBadge from '@/components/dashboard/GameStatusBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx";

const GameCard = ({ game, isActiveGame, isAnotherGameActive, isUpdatingStatus, onContinueGame, onDeleteGame, onGameStatusChange }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border/30 dark:border-border/50 bg-card/70 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-foreground leading-tight">{game.summary || `Velada del ${game.date}`}</CardTitle>
          <GameStatusBadge status={game.status} />
        </div>
        <CardDescription className="text-sm text-muted-foreground pt-1">
          Fecha: {game.date}
          {game.locationName ? ` • Lugar: ${game.locationName}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {game.tables && game.tables.length > 0 
            ? `${game.tables.length} mesa${game.tables.length > 1 ? 's' : ''} jugada${game.tables.length > 1 ? 's' : ''}.`
            : "Sin mesas registradas."}
          {game.anecdotes && game.anecdotes.length > 0 ? ` Con ${game.anecdotes.length} anécdota${game.anecdotes.length > 1 ? 's' : ''}.` : ""}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-border/20 dark:border-border/30">
        <div className="flex space-x-2 mb-3 sm:mb-0">
           <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/game/${game.id}`)}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <ArrowRight className="mr-1 h-4 w-4" /> Ingresar a la Velada
            </Button>
          {game.status === "En curso" ? (
            <>
               <Button 
                variant="outline" 
                size="sm"
                onClick={() => onGameStatusChange(game.id, 'Finalizada')}
                disabled={isUpdatingStatus}
                className="border-green-500 text-green-600 hover:bg-green-500/10 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-400/10"
              >
                {isUpdatingStatus ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-1 h-4 w-4" />}
                Finalizar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onGameStatusChange(game.id, 'Cancelada')}
                disabled={isUpdatingStatus}
                className="border-amber-500 text-amber-600 hover:bg-amber-500/10 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-400/10"
              >
                 {isUpdatingStatus ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <XSquare className="mr-1 h-4 w-4" />}
                Cancelar
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onGameStatusChange(game.id, 'En curso')}
              disabled={isUpdatingStatus || isAnotherGameActive}
              className="border-sky-500 text-sky-600 hover:bg-sky-500/10 dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-400/10"
              title={isAnotherGameActive ? "Ya hay otra velada en curso" : game.status === 'Borrador' ? "Inicia la velada cuando estén listos" : "Reabrir velada"}
            >
               {isUpdatingStatus ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Play className="mr-1 h-4 w-4" />}
              {game.status === 'Borrador' ? 'Iniciar' : 'Reabrir'}
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la velada
                  y todos sus datos asociados (mesas, manos, anécdotas).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteGame(game.id)} className="bg-destructive hover:bg-destructive/90">
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default GameCard;