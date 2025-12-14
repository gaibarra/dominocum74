import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const posts = [
  {
    id: 1,
    title: "Factores que influyen en la valuación de inmuebles comerciales",
    excerpt: "Descubre los principales factores que determinan el valor de los inmuebles comerciales en el mercado actual y cómo maximizar su potencial.",
    date: "15 Mayo, 2025",
    image: "",
    slug: "factores-valuacion-inmuebles-comerciales"
  },
  {
    id: 2,
    title: "Métodos de valuación de empresas: ¿Cuál es el más adecuado?",
    excerpt: "Analizamos los diferentes métodos de valuación de empresas y te ayudamos a identificar cuál es el más adecuado según el tipo y tamaño de tu negocio.",
    date: "2 Mayo, 2025",
    image: "",
    slug: "metodos-valuacion-empresas"
  },
  {
    id: 3,
    title: "La importancia de los avalúos en procesos de herencia",
    excerpt: "Conoce por qué es fundamental contar con avalúos profesionales durante los procesos de herencia y cómo pueden evitar conflictos familiares.",
    date: "28 Abril, 2025",
    image: "",
    slug: "importancia-avaluos-herencia"
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

const LatestPosts = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <h2 className="mb-4">Últimos Artículos</h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Mantente actualizado con nuestros artículos sobre valuación, mercado inmobiliario y tendencias del sector.
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
                  <img  alt={post.title} className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1685219789185-15f3fab44379" />
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