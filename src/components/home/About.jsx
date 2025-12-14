import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const About = () => {
  const benefits = [
    "Valuador certificado con más de 15 años de experiencia",
    "Metodologías actualizadas y respaldadas técnicamente",
    "Informes detallados y comprensibles para toma de decisiones",
    "Atención personalizada y confidencialidad garantizada",
    "Conocimiento profundo del mercado inmobiliario y empresarial"
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="relative z-10 rounded-lg overflow-hidden shadow-xl">
              <img  alt="Arquitecto profesional en su oficina" src="https://images.unsplash.com/photo-1697638164340-6c5fc558bdf2" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-full h-full border-4 border-primary rounded-lg z-0"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="mb-6">
              <span className="gradient-text">Experiencia y Profesionalismo</span>
              <span className="block">en Cada Valuación</span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-6">
              Soy un arquitecto especializado en valuación de inmuebles y empresas, 
              con más de 15 años de experiencia en el sector. Mi enfoque combina 
              conocimientos técnicos, análisis de mercado y metodologías actualizadas 
              para ofrecer valuaciones precisas y confiables.
            </p>
            
            <p className="text-lg text-gray-600 mb-8">
              Mi objetivo es proporcionar a mis clientes información clara y 
              fundamentada que les permita tomar decisiones informadas sobre sus 
              activos, ya sea para compra-venta, financiamiento, seguros, 
              planificación fiscal o procesos legales.
            </p>
            
            <ul className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="flex items-start"
                >
                  <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </motion.li>
              ))}
            </ul>
            
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-4">
                <img  alt="Cliente satisfecho" className="w-12 h-12 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1522823284596-b660df2a6950" />
                <img  alt="Cliente satisfecho" className="w-12 h-12 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1700227047786-8835486ba7af" />
                <img  alt="Cliente satisfecho" className="w-12 h-12 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1686434538608-4b6eedeeef65" />
              </div>
              <div>
                <div className="font-semibold">+500 clientes satisfechos</div>
                <div className="text-sm text-gray-500">Confianza y resultados</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;