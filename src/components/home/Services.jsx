import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Building, 
  Home, 
  BarChart4, 
  Scale, 
  TrendingUp,
  ArrowRight 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const services = [
  {
    title: "Valuación de Inmuebles",
    description: "Determinamos el valor de mercado de propiedades residenciales, comerciales e industriales con métodos precisos y actualizados.",
    icon: <Home className="h-10 w-10 text-primary" />,
    link: "/servicios#inmuebles"
  },
  {
    title: "Valuación de Empresas",
    description: "Analizamos el valor de negocios y empresas considerando activos tangibles e intangibles, flujos de efectivo y potencial de crecimiento.",
    icon: <Building className="h-10 w-10 text-primary" />,
    link: "/servicios#empresas"
  },
  {
    title: "Consultoría Inmobiliaria",
    description: "Asesoramos en decisiones de inversión, compra, venta y desarrollo de proyectos inmobiliarios con análisis de mercado detallados.",
    icon: <BarChart4 className="h-10 w-10 text-primary" />,
    link: "/servicios#consultoria"
  },
  {
    title: "Peritajes Judiciales",
    description: "Elaboramos dictámenes periciales para procesos judiciales con rigor técnico y metodológico que respaldan decisiones legales.",
    icon: <Scale className="h-10 w-10 text-primary" />,
    link: "/servicios#peritajes"
  },
  {
    title: "Estudios de Mercado",
    description: "Realizamos análisis de mercado inmobiliario para identificar tendencias, oportunidades y riesgos en diferentes segmentos y zonas.",
    icon: <TrendingUp className="h-10 w-10 text-primary" />,
    link: "/servicios#estudios"
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const Services = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="mb-4">Nuestros Servicios</h2>
          <p className="text-lg text-gray-600">
            Ofrecemos una amplia gama de servicios profesionales de valuación y consultoría para satisfacer sus necesidades específicas.
          </p>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full card-hover">
                <CardHeader>
                  <div className="mb-4">{service.icon}</div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="ghost" className="p-0 hover:bg-transparent">
                    <Link to={service.link} className="flex items-center text-primary">
                      Saber más <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        
        <div className="text-center mt-12">
          <Button asChild size="lg">
            <Link to="/servicios">Ver todos los servicios</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;