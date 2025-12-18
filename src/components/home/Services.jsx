import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  LayoutDashboard,
  LineChart,
  Radio,
  Users2,
  ArrowRight,
} from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Control total de la velada",
    description: "Registra asistencia, asigna mesas y define parejas en cuestión de segundos con reglas adaptables a cada torneo.",
    icon: <LayoutDashboard className="h-10 w-10 text-primary" />,
    link: "/dashboard",
  },
  {
    title: "Bitácora en vivo",
    description: "Cada mano queda guardada con hora, puntos y jugadores. Libreta digital para árbitros y organizadores.",
    icon: <Activity className="h-10 w-10 text-primary" />,
    link: "/game",
  },
  {
    title: "Transmisión comunitaria",
    description: "Comparte el avance de las mesas con familiares y jugadores remotos gracias al canal de eventos en tiempo real.",
    icon: <Radio className="h-10 w-10 text-primary" />,
    link: "/realtime",
  },
  {
    title: "Calendario inteligente",
    description: "Agenda veladas, envía recordatorios y controla la capacidad de mesas desde un solo panel.",
    icon: <CalendarDays className="h-10 w-10 text-primary" />,
    link: "/dashboard",
  },
  {
    title: "Perfil histórico de jugadores",
    description: "Acumula rachas, promedios y asistencia de cada jugador para definir rankings transparentes.",
    icon: <Users2 className="h-10 w-10 text-primary" />,
    link: "/players",
  },
  {
    title: "Analítica del club",
    description: "Visualiza tendencias de manos ganadas, rendimiento por mesa y registros fotográficos de cada velada.",
    icon: <LineChart className="h-10 w-10 text-primary" />,
    link: "/stats",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Services = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <p className="uppercase tracking-[0.3em] text-xs text-primary mb-4">Plataforma del club</p>
          <h2 className="mb-4">Todo lo que necesitas para una velada impecable</h2>
          <p className="text-lg text-gray-600">
            Deja atrás las hojas de cálculo. Domina desde el primer saludo hasta la foto final con herramientas diseñadas para la cultura del Dominó CUM 74.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item}>
              <Card className="h-full border border-slate-200 hover:border-primary/30 transition-colors">
                <CardHeader>
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="text-base mt-3 text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="ghost" className="px-0 text-primary">
                    <Link to={feature.link} className="flex items-center">
                      Descubrir más <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-14">
          <Button asChild size="lg">
            <Link to="/dashboard">Explorar tablero completo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;