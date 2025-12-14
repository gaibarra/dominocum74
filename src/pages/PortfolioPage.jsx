import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const projects = [
  {
    title: "Valuación de Centro Comercial Premium",
    category: "Inmuebles Comerciales",
    description: "Valuación integral de un centro comercial de 45,000 m² para refinanciamiento bancario, incluyendo análisis de ingresos, ocupación y proyecciones financieras.",
    image: "https://images.unsplash.com/photo-1519567770579-c2fc5208683b"
  },
  {
    title: "Valuación de Empresa Manufacturera",
    category: "Valuación Empresarial",
    description: "Determinación del valor de mercado de una empresa manufacturera con operaciones en tres países para proceso de fusión, considerando activos tangibles e intangibles.",
    image: "https://images.unsplash.com/photo-1664575602554-2087b04935d5"
  },
  {
    title: "Desarrollo Residencial de Lujo",
    category: "Consultoría Inmobiliaria",
    description: "Estudio de viabilidad y valuación para un desarrollo residencial de lujo de 120 unidades, incluyendo análisis de mercado y proyecciones financieras.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
  },
  {
    title: "Peritaje Judicial para División de Bienes",
    category: "Peritajes Judiciales",
    description: "Dictamen pericial para proceso de división de bienes inmobiliarios en litigio familiar, incluyendo valoración de 12 propiedades en diferentes ubicaciones.",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f"
  },
  {
    title: "Estudio de Mercado Zona Metropolitana",
    category: "Estudios de Mercado",
    description: "Análisis exhaustivo del mercado inmobiliario residencial en la zona metropolitana, identificando tendencias, oportunidades y proyecciones de crecimiento.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
  },
  {
    title: "Valuación de Complejo Industrial",
    category: "Inmuebles Industriales",
    description: "Valuación de un complejo industrial de 80,000 m² incluyendo naves, oficinas y terrenos para efectos de venta, considerando instalaciones especializadas y contaminación.",
    image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122"
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

const PortfolioPage = () => {
  return (
    <main className="pt-24">
      <section className="py-12 md:py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 text-white"
            >
              Nuestro Portafolio
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-blue-100 mb-8"
            >
              Conozca algunos de nuestros proyectos más destacados en valuación de inmuebles y empresas.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {projects.map((project, index) => (
              <motion.div key={index} variants={item} className="group">
                <div className="bg-white rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="relative h-64 overflow-hidden">
                    <img  alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={project.image} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-6">
                        <span className="text-sm text-blue-300 font-medium">{project.category}</span>
                        <h3 className="text-xl font-bold text-white mt-1">{project.title}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <span className="text-sm text-blue-600 font-medium">{project.category}</span>
                    <h3 className="text-xl font-bold mt-1 mb-3">{project.title}</h3>
                    <p className="text-gray-600">{project.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-16 text-center">
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Estos son solo algunos ejemplos de los proyectos que hemos realizado. Cada valuación es única y se adapta a las necesidades específicas de cada cliente.
            </p>
            <Button asChild size="lg">
              <Link to="/contacto" className="flex items-center">
                Solicitar una Valuación
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="mb-4">Nuestros Clientes</h2>
            <p className="text-lg text-gray-600">
              Hemos trabajado con una amplia variedad de clientes, desde propietarios individuales hasta grandes corporaciones e instituciones.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[...Array(6)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center"
              >
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-semibold">Cliente {index + 1}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="mb-6">Metodología de Trabajo</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Nuestro enfoque metodológico garantiza valuaciones precisas, objetivas y fundamentadas en cada proyecto que realizamos.
                </p>
                
                <div className="space-y-6">
                  {[
                    {
                      title: "1. Análisis Inicial",
                      description: "Evaluamos sus necesidades específicas y definimos el alcance del trabajo."
                    },
                    {
                      title: "2. Recopilación de Información",
                      description: "Recolectamos todos los datos relevantes sobre el inmueble o empresa a valuar."
                    },
                    {
                      title: "3. Inspección Detallada",
                      description: "Realizamos una inspección minuciosa para verificar características y condiciones."
                    },
                    {
                      title: "4. Análisis de Mercado",
                      description: "Estudiamos el mercado relevante para identificar comparables y tendencias."
                    },
                    {
                      title: "5. Aplicación de Metodologías",
                      description: "Utilizamos las metodologías más adecuadas según el tipo de bien y propósito."
                    },
                    {
                      title: "6. Informe Detallado",
                      description: "Elaboramos un informe completo con conclusiones claras y fundamentadas."
                    }
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <h4 className="text-lg font-bold">{step.title}</h4>
                      <p className="text-gray-600">{step.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="relative">
                  <div className="rounded-lg overflow-hidden shadow-xl">
                    <img  alt="Arquitecto trabajando en un informe de valuación" className="w-full h-auto" src="https://images.unsplash.com/photo-1664575599736-c5197c684128" />
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-full h-full border-4 border-primary rounded-lg z-0"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-white mb-6">¿Necesita una Valuación Profesional?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Contáctenos hoy mismo para discutir su proyecto y cómo podemos ayudarle con nuestros servicios de valuación.
            </p>
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              <Link to="/contacto" className="text-base">
                Solicitar una Consulta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PortfolioPage;