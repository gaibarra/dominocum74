import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Valeria Uc",
    position: "Capitana · Mesa 3",
    company: "Velada 72",
    content: "Poder revisar quién llegó, qué manos jugamos y cuánto sumamos nos ha evitado discusiones eternas. El dashboard se volvió el tercer árbitro.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
  },
  {
    name: "Dr. Martín Parra",
    position: "Organizador histórico",
    company: "CUM 74",
    content: "Antes tardábamos dos días en cerrar actas y publicar resultados. Ahora en 15 minutos enviamos la crónica con tablas y fotos a todo el club.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
  },
  {
    name: "Renata Peña",
    position: "Jugadora novata",
    company: "Liga abierta",
    content: "Entré a la comunidad sin conocer a nadie. El registro de pares y las historias de veladas me ayudaron a entender la cultura y sentirme parte.",
    image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39"
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="uppercase tracking-[0.3em] text-xs text-primary mb-3">Voces del club</p>
          <h2 className="mb-4">Historias que hacen grande a la velada</h2>
          <p className="text-lg text-gray-600">
            Cada reseña es una ficha más en la memoria del Dominó CUM 74. Jugadores, anfitriones y nuevos talentos comparten cómo la plataforma elevó la experiencia.
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
              <div className="bg-white p-8 rounded-3xl shadow-lg h-full flex flex-col border border-slate-100">
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