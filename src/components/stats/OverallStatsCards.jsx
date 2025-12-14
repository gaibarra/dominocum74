import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.45,
      ease: "easeOut",
    },
  }),
};

const numberFormatter = new Intl.NumberFormat("es-MX");

const OverallStatsCards = ({ totalGames = 0, totalHands = 0, mostActivePlayer, lastUpdatedLabel }) => {
  return (
    <div className="mb-10 space-y-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="glassmorphism-card border-primary/40 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-primary">Partidas registradas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-primary">{numberFormatter.format(totalGames)}</p>
              <p className="text-xs text-muted-foreground">Acumulado histórico</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="glassmorphism-card border-secondary/40 bg-gradient-to-br from-secondary/5 via-transparent to-transparent">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-secondary">Manos contabilizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-secondary">{numberFormatter.format(totalHands)}</p>
              <p className="text-xs text-muted-foreground">Incluye manos en curso</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="glassmorphism-card border-accent/40 bg-gradient-to-br from-accent/10 via-transparent to-transparent">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-accent">Jugador/a más activo</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              {mostActivePlayer ? (
                <>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={mostActivePlayer.photo} alt={mostActivePlayer.nickname} />
                    <AvatarFallback>{mostActivePlayer.nickname?.[0] || '¿'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold text-accent">{mostActivePlayer.nickname}</p>
                    <p className="text-xs text-muted-foreground">{numberFormatter.format(mostActivePlayer.minutesPlayed || 0)} min presentes</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no hay actividad registrada.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      {lastUpdatedLabel && (
        <p className="text-right text-xs text-muted-foreground">Última actualización: {lastUpdatedLabel}</p>
      )}
    </div>
  );
};

export default OverallStatsCards;