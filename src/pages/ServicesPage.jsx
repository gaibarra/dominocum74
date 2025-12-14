import React from "react";
import { motion } from "framer-motion";
import { services } from "@/data/servicesData";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ServicesPage = () => {
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
              Nuestros Servicios
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-blue-100 mb-8"
            >
              Ofrecemos una amplia gama de servicios profesionales de valuación y consultoría
              adaptados a las necesidades específicas de cada cliente.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          {services.map((service, index) => (
            <div 
              key={service.id} 
              id={service.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index !== 0 ? "mt-24" : ""
              }`}
            >
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`order-2 ${index % 2 === 0 ? "lg:order-1" : "lg:order-2"}`}
              >
                <h2 className="mb-6">{service.title}</h2>
                <div className="prose prose-lg max-w-none text-gray-600">
                  {service.longDescription.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
                <Button asChild className="mt-8">
                  <Link to="/contacto" className="flex items-center">
                    Solicitar este servicio
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`order-1 ${index % 2 === 0 ? "lg:order-2" : "lg:order-1"}`}
              >
                <div className="relative">
                  <div className="rounded-lg overflow-hidden shadow-xl">
                    <img  alt={service.title} className="w-full h-auto" src={service.image} />
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-full h-full border-4 border-primary rounded-lg z-0"></div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>
      
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="mb-6">¿Por qué elegirnos?</h2>
            <p className="text-lg text-gray-600 mb-12">
              Nuestro compromiso con la excelencia y la precisión nos distingue en el campo de la valuación profesional.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Experiencia Comprobada",
                description: "Más de 15 años de experiencia en valuación de inmuebles y empresas en diversos sectores y mercados.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                )
              },
              {
                title: "Certificaciones Profesionales",
                description: "Contamos con todas las certificaciones y acreditaciones necesarias para realizar valuaciones con validez legal y técnica.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 15l-2 5l9-13H9l2-5L2 15h10z"></path>
                  </svg>
                )
              },
              {
                title: "Metodologías Actualizadas",
                description: "Utilizamos las metodologías más avanzadas y reconocidas internacionalmente, adaptadas a las particularidades del mercado local.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                )
              },
              {
                title: "Atención Personalizada",
                description: "Cada cliente recibe atención individualizada y soluciones adaptadas a sus necesidades específicas y objetivos particulares.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                )
              },
              {
                title: "Informes Detallados",
                description: "Nuestros informes son exhaustivos, claros y fundamentados, proporcionando toda la información necesaria para tomar decisiones informadas.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                )
              },
              {
                title: "Confidencialidad",
                description: "Garantizamos absoluta confidencialidad en el manejo de toda la información proporcionada por nuestros clientes.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                )
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-lg shadow-md"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-white mb-6">¿Listo para comenzar?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Contáctenos hoy mismo para discutir sus necesidades de valuación y cómo podemos ayudarle.
            </p>
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              <Link to="/contacto" className="text-base">
                Solicitar una Valuación
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ServicesPage;