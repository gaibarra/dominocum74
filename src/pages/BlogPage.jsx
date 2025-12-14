import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { blogPosts, blogCategories, popularTags } from "@/data/blogData";
import BlogCard from "@/components/blog/BlogCard";
import BlogSearch from "@/components/blog/BlogSearch";
import BlogSidebar from "@/components/blog/BlogSidebar";

const BlogPage = () => {
  const [filteredPosts, setFilteredPosts] = useState(blogPosts);
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredPosts(blogPosts);
      return;
    }
    
    const filtered = blogPosts.filter(post => 
      post.title.toLowerCase().includes(term.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(term.toLowerCase()) ||
      post.content.toLowerCase().includes(term.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase())) ||
      post.category.toLowerCase().includes(term.toLowerCase())
    );
    
    setFilteredPosts(filtered);
  };
  
  useEffect(() => {
    // Reset to top of page when component mounts
    window.scrollTo(0, 0);
  }, []);
  
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
              Blog de Valuación
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-blue-100 mb-8"
            >
              Artículos, guías y análisis sobre valuación de inmuebles, empresas y tendencias del mercado.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <BlogSearch onSearch={handleSearch} />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {searchTerm && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">
                    Resultados para: "{searchTerm}"
                  </h2>
                  <p className="text-gray-600">
                    Se encontraron {filteredPosts.length} artículos que coinciden con tu búsqueda.
                  </p>
                </div>
              )}
              
              {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredPosts.map((post, index) => (
                    <BlogCard key={post.id} post={post} index={index} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <h3 className="text-xl font-bold mb-2">No se encontraron resultados</h3>
                  <p className="text-gray-600 mb-4">
                    No hemos encontrado artículos que coincidan con tu búsqueda. Intenta con otros términos.
                  </p>
                  <button 
                    onClick={() => handleSearch("")}
                    className="text-primary hover:underline"
                  >
                    Ver todos los artículos
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <BlogSidebar 
                categories={blogCategories} 
                recentPosts={blogPosts.slice(0, 4)} 
                popularTags={popularTags} 
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default BlogPage;