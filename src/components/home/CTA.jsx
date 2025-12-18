import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays } from "lucide-react";

const CTA = () => {
  return (
    <section className="relative py-24 text-white overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1471452323662-05699fd20132"
          alt="Mesa de dominó preparada para el torneo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/80" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="uppercase tracking-[0.3em] text-xs text-blue-200 mb-4">Convocatoria abierta</p>
            <h2 className="text-white mb-6">¿Listo para la velada 75?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl">
              Reserva tu lugar, pre-registra a tu pareja y sube fotos para la bitácora antes de que suene la primera ficha. Cada registro aporta a la memoria colectiva del CUM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-blue-100">
                <Link to="/nueva-velada" className="text-base">
                  Apartar mesa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base border-white text-white hover:bg-white/10">
                <Link to="/players">Ver ranking de jugadores</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl bg-white/10 border border-white/20 p-8 backdrop-blur"
          >
            <div className="flex items-center gap-3 text-blue-100">
              <CalendarDays className="h-6 w-6" />
              <span>Agenda del club</span>
            </div>
            <div className="mt-6 text-3xl font-semibold">Jueves 18 de enero · 19:30 h</div>
            <p className="text-blue-100 mt-2">Salón principal · 12 mesas disponibles</p>
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-blue-100">Formato</p>
                <p className="text-xl font-semibold text-white">Parejas mixtas</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-blue-100">Registro</p>
                <p className="text-xl font-semibold text-white">Cierra 48 h antes</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-blue-100">Crónica</p>
                <p className="text-xl font-semibold text-white">Fotógrafos invitados</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-blue-100">Streaming</p>
                <p className="text-xl font-semibold text-white">Canal privado</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTA;