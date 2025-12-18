import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const posts = [
  {
    id: 1,
    title: "Cómo armamos la Velada 74 en 25 minutos",
    excerpt: "Checklist, roles y automatizaciones para recibir a 60 jugadores sin caos y con crónica lista antes de medianoche.",
    date: "12 Dic, 2025",
    image: "https://images.unsplash.com/photo-1513863323963-1cc3c6889a83",
    slug: "velada-74-checklist",
  },
  {
    id: 2,
    title: "Trucos para rotar mesas sin romper las rachas",
    excerpt: "Guía rápida para equilibrar parejas, mantener la competitividad y documentar cada cambio dentro de la app.",
    date: "4 Dic, 2025",
    image: "https://images.unsplash.com/photo-1504274066651-8d31a536b11a",
    slug: "rotar-mesas-cum",
  },
  {
    id: 3,
    title: "Fotografía y narrativa: la crónica que todos comparten",
    excerpt: "Tips para capturar momentos clave, etiquetar jugadores y lanzar la galería minutos después de cerrar las manos.",
    date: "28 Nov, 2025",
    image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606",
    slug: "cronica-velada",
  },
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

const LatestPosts = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <p className="uppercase tracking-[0.3em] text-xs text-primary mb-3">Blog del club</p>
            <h2 className="mb-4">Crónicas y consejos para no perder ninguna ficha</h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Experiencias del comité organizador, guías de protocolos y hacks que hacen únicas las noches de Dominó del CUM 74.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-4 md:mt-0">
            <Link to="/blog" className="flex items-center">
              Ver todos los artículos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {posts.map((post) => (
            <motion.div key={post.id} variants={item}>
              <Card className="h-full card-hover">
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img  alt={post.title} className="w-full h-full object-cover" src={post.image} />
                </div>
                <CardHeader>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{post.date}</span>
                  </div>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="text-base mt-2 line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="ghost" className="p-0 hover:bg-transparent">
                    <Link to={`/blog/${post.slug}`} className="flex items-center text-primary">
                      Leer más <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LatestPosts;