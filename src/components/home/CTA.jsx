import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-white mb-6">
              ¿Necesita una Valuación Profesional?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-lg">
              Contáctenos hoy mismo para obtener una valuación precisa y 
              profesional de sus inmuebles o empresa. Nuestro equipo está 
              listo para ayudarle a tomar las mejores decisiones basadas 
              en información confiable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Link to="/contacto" className="text-base">
                  Solicitar Valuación
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base border-white text-white hover:bg-blue-700">
                <Link to="/servicios">Conocer Servicios</Link>
              </Button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden shadow-lg transform translate-y-8">
                  <img  alt="Edificio moderno de oficinas" className="w-full h-48 object-cover" src="https://images.unsplash.com/photo-1683022928893-cf011abdb205" />
                </div>
                <div className="rounded-lg overflow-hidden shadow-lg">
                  <img  alt="Arquitecto revisando planos" className="w-full h-48 object-cover" src="https://images.unsplash.com/photo-1608152914360-ed0d086e3a9e" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden shadow-lg">
                  <img  alt="Residencia de lujo" className="w-full h-48 object-cover" src="https://images.unsplash.com/photo-1506851321937-51fff21bc9a0" />
                </div>
                <div className="rounded-lg overflow-hidden shadow-lg transform translate-y-8">
                  <img  alt="Reunión de negocios para valuación" className="w-full h-48 object-cover" src="https://images.unsplash.com/photo-1569083676317-dafd0fc965f7" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTA;