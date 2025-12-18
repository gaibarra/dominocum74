import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Crown, Sparkles } from "lucide-react";

const milestones = [
  { year: "2010", text: "Primera velada oficial en el Club Universitario de Médicos." },
  { year: "2018", text: "Nace el ranking interno con 40 jugadores activos." },
  { year: "2023", text: "Se lanza Domino CUM 74 con registro digital en tiempo real." },
];

const pillars = [
  "Respeto absoluto por la tradición y la camaradería.",
  "Datos abiertos para decisiones transparentes en cada mesa.",
  "Experiencia de velada diseñada para jugadores, anfitriones y espectadores.",
];

const About = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1470238660365-4d7edaf2784b" alt="Jugadores de dominó celebrando una partida" className="object-cover w-full h-full" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -top-6 -left-10 w-32 h-32 bg-slate-900/10 rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="uppercase tracking-[0.3em] text-xs text-primary mb-3">Nuestra historia</p>
            <h2 className="mb-6">Catorce años conectando a la familia CUM con fichas, historias y métricas.</h2>
            <p className="text-lg text-gray-600 mb-8">
              Dominó CUM 74 es más que un registro: es la memoria viva de cada velada. Aquí convivimos los fundadores de la tradición, las nuevas generaciones y todos los que queremos preservar la emoción del club.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {milestones.map((milestone) => (
                <div key={milestone.year} className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-primary font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4" /> {milestone.year}</div>
                  <p className="text-sm text-gray-600 mt-2">{milestone.text}</p>
                </div>
              ))}
            </div>

            <ul className="space-y-4 mb-8">
              {pillars.map((pillar, index) => (
                <motion.li
                  key={pillar}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start"
                >
                  <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{pillar}</span>
                </motion.li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <Crown className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">Liga interna</p>
                  <p className="text-sm text-gray-500">+20 campeones históricos</p>
                </div>
              </div>
              <div className="text-sm text-gray-500 max-w-xs">
                Guardamos fotos, anécdotas y estadísticas para que cada nueva velada honre a la anterior.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;