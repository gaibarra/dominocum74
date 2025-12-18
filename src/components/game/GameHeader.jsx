// components/game/GameHeader.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  Edit3,
  CheckSquare,
  FileDown,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import { formatDateForDisplay } from '@/lib/dateUtils';
import { useToast } from "@/components/ui/use-toast";
import { updateGameStatus as updateGameStatusAPI } from '@/lib/storage';
import dayjs from 'dayjs';

const GameHeader = ({
  game,
  setGame,
  playersData,
  onRefresh,
  cardVariants,
  showFinishedTables,
  setShowFinishedTables,
  presentCount = 0,
  benchCount = 0,
}) => {
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    if (!game || !playersData?.length) {
      toast({
        title: "Error",
        description: "Datos insuficientes para generar el PDF.",
        variant: "destructive",
      });
      console.error("PDF Generation Error:", { game, playersData });
      return;
    }
    try {
  const { generateGameSummaryPDF } = await import('@/lib/pdfGenerator');
  await generateGameSummaryPDF(game, playersData);
      toast({
        title: "PDF Generado",
        description: "El resumen de la velada se está descargando.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error al generar PDF",
        description: `Hubo un problema: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!game?.id) {
      toast({ title: "Error", description: "ID de velada no disponible.", variant: "destructive" });
      return;
    }
    // Guardar: exigir al menos 4 presentes para iniciar
    if (newStatus === 'En curso' && presentCount < 4) {
      toast({ title: 'No puedes iniciar aún', description: 'Necesitas al menos 4 jugadores presentes. Pasa lista primero.', variant: 'destructive' });
      document?.getElementById('attendance')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Bloqueo de reapertura tras 12h desde finalización (prioriza closed_at)
    if (newStatus === 'En curso' && game.status === 'Finalizada') {
      const closedAt = game.closed_at;
      const allHands = (game.tables || []).flatMap(t => t.hands || []);
      const lastEnd = closedAt || (allHands
        .map(h => h.end_time || h.updated_at || h.created_at)
        .filter(Boolean)
        .sort()
        .slice(-1)[0] || game.updated_at || game.date);
      if (lastEnd) {
        const hours = dayjs().diff(dayjs(lastEnd), 'hour');
        if (hours >= 12) {
          toast({ title: 'Velada clausurada', description: 'Han pasado más de 12 horas desde la finalización. No se puede reabrir.', variant: 'destructive' });
          return;
        }
      }
    }
    try {
      const updated = await updateGameStatusAPI(game.id, newStatus);
      if (!updated) throw new Error("No se recibieron datos actualizados.");
      setGame(prev => ({
        ...prev,
        status: newStatus,
        updated_at: updated.updated_at
      }));
      toast({ title: "Estado Actualizado", description: `Ahora está "${newStatus}".` });
  // Efectos de celebración eliminados
      onRefresh();
    } catch (error) {
      console.error('Error updating game status:', error);
      toast({
        title: "Error al actualizar",
        description: `No se pudo cambiar el estado: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-card rounded-xl shadow-xl glassmorphism-card mb-8">
        <AlertTriangle className="h-12 w-12 text-yellow-400 mb-4" />
        <p className="text-muted-foreground">Cargando datos de la velada...</p>
      </div>
    );
  }

  return (
    <motion.div
      custom={0}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-card p-6 rounded-xl shadow-xl glassmorphism-card mb-8"
    >
      {/* Título y resumen */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">
            Velada del {formatDateForDisplay(game.date)}
          </h1>
          <p className="text-muted-foreground flex items-center mt-2">
            <CalendarDays className="h-4 w-4 mr-2" />
            {game.summary || '¡Que comience el juego!'}
          </p>
          {(game.locationName || game.locationDetails) && (
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {game.locationName && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{game.locationName}</span>
                </p>
              )}
              {game.locationDetails && (
                <p className="flex items-start gap-2">
                  <ClipboardList className="h-4 w-4 text-primary mt-0.5" />
                  <span>{game.locationDetails}</span>
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            Presentes: {presentCount} • Libres: {benchCount}
          </span>
        </div>
      </div>

      {/* Estado y acciones */}
      <div className="mt-6 pt-4 border-t border-border/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
          game.status === 'En curso'
            ? 'bg-green-500/20 text-green-400'
            : game.status === 'Finalizada'
            ? 'bg-blue-500/20 text-blue-400'
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          Estado: {game.status}
        </span>
        {game.closed_at && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-400/30">
            Clausurada: {new Date(game.closed_at).toLocaleString()}
          </span>
        )}

        <div className="flex flex-wrap gap-2">
          {game.status === 'Borrador' && (
            <Button
              onClick={() => handleUpdateStatus('En curso')}
              variant="outline"
              disabled={presentCount < 4}
              className="neumorphism-button-sm border-green-500 text-green-500 hover:bg-green-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
              title={presentCount < 4 ? 'Necesitas al menos 4 jugadores presentes' : undefined}
            >
              <CheckSquare className="mr-2 h-4 w-4" /> Iniciar Velada
            </Button>
          )}
          {game.status === 'Borrador' && (
            <span className="text-xs text-muted-foreground">
              Pasa lista primero (mín. 4 presentes) para poder agregar mesas.
            </span>
          )}
          {game.status === 'En curso' && (
            <Button
              onClick={() => handleUpdateStatus('Finalizada')}
              variant="outline"
              className="neumorphism-button-sm border-green-500 text-green-500 hover:bg-green-500/10"
            >
              <CheckSquare className="mr-2 h-4 w-4" /> Finalizar Velada
            </Button>
          )}
          {game.status === 'Finalizada' && (() => {
            const closedAt = game.closed_at;
            const allHands = (game.tables || []).flatMap(t => t.hands || []);
            const lastEnd = closedAt || (allHands
              .map(h => h.end_time || h.updated_at || h.created_at)
              .filter(Boolean)
              .sort()
              .slice(-1)[0] || game.updated_at || game.date);
            const locked = lastEnd ? dayjs().diff(dayjs(lastEnd), 'hour') >= 12 : false;
            return (
              <Button
                onClick={() => handleUpdateStatus('En curso')}
                variant="outline"
                disabled={locked}
                className="neumorphism-button-sm border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                title={locked ? 'Clausurada: no se puede reabrir después de 12 horas' : undefined}
              >
                <Edit3 className="mr-2 h-4 w-4" /> Reabrir Velada
              </Button>
            );
          })()}

          {/* Toggle de Partidas */}
          <Button
            onClick={() => setShowFinishedTables(prev => !prev)}
            variant="outline"
            className="neumorphism-button-sm"
          >
            {showFinishedTables
              ? <><EyeOff className="mr-2 h-4 w-4" /> Ver en Curso</>
              : <><Eye className="mr-2 h-4 w-4" /> Ver Mesas Finalizadas</>
            }
          </Button>

          {/* Acciones generales */}
          <Button onClick={onRefresh} variant="outline" className="neumorphism-button-sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
          <Button onClick={handleDownloadPdf} variant="outline" className="neumorphism-button-sm">
            <FileDown className="mr-2 h-4 w-4" /> Descargar PDF
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default GameHeader;
