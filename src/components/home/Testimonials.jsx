import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Carlos Rodríguez",
    position: "Director de Inversiones Inmobiliarias",
    company: "Grupo Inmobiliario XYZ",
    content: "La valuación realizada fue fundamental para nuestra decisión de inversión. El informe detallado y el análisis de mercado nos dieron la confianza necesaria para proceder con la compra del inmueble.",
    image: ""
  },
  {
    name: "Laura Méndez",
    position: "Gerente General",
    company: "Constructora Méndez",
    content: "Excelente servicio profesional. La valuación de nuestra empresa fue realizada con gran precisión y nos ayudó enormemente en el proceso de fusión. Recomiendo ampliamente sus servicios.",
    image: ""
  },
  {
    name: "Miguel Ángel Torres",
    position: "Propietario",
    company: "Torres & Asociados",
    content: "El peritaje judicial realizado fue clave para resolver favorablemente nuestro caso. La claridad del informe y la solidez técnica fueron determinantes en la decisión del juez.",
    image: ""
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="mb-4">Lo que Dicen Nuestros Clientes</h2>
          <p className="text-lg text-gray-600">
            La satisfacción de nuestros clientes es nuestro mejor aval. Conoce las experiencias de quienes han confiado en nuestros servicios.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="bg-white p-8 rounded-lg shadow-md h-full flex flex-col">
                <Quote className="h-10 w-10 text-primary/20 mb-4" />
                
                <p className="text-gray-700 mb-6 flex-grow">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">
                      {testimonial.position}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;