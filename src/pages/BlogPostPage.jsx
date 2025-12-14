import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { blogPosts, blogCategories, popularTags } from "@/data/blogData";
import { Button } from "@/components/ui/button";
import { Calendar, User, Tag, ArrowLeft, ArrowRight } from "lucide-react";
import BlogSidebar from "@/components/blog/BlogSidebar";

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);
  const [prevPost, setPrevPost] = useState(null);
  
  useEffect(() => {
    // Find the current post
    const currentPost = blogPosts.find(p => p.slug === slug);
    setPost(currentPost);
    
    if (currentPost) {
      // Find the index of the current post
      const currentIndex = blogPosts.findIndex(p => p.id === currentPost.id);
      
      // Set next and previous posts
      if (currentIndex > 0) {
        setPrevPost(blogPosts[currentIndex - 1]);
      } else {
        setPrevPost(null);
      }
      
      if (currentIndex < blogPosts.length - 1) {
        setNextPost(blogPosts[currentIndex + 1]);
      } else {
        setNextPost(null);
      }
    }
    
    // Reset to top of page when post changes
    window.scrollTo(0, 0);
  }, [slug]);
  
  if (!post) {
    return (
      <div className="pt-24 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Artículo no encontrado</h1>
          <p className="text-lg text-gray-600 mb-8">
            El artículo que estás buscando no existe o ha sido movido.
          </p>
          <Button asChild>
            <Link to="/blog">Volver al Blog</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <main className="pt-24">
      <section className="py-12 md:py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-blue-500 text-white text-sm px-3 py-1 rounded-full mb-4"
            >
              {post.category}
            </motion.span>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 text-white"
            >
              {post.title}
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4 text-blue-100"
            >
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{post.date}</span>
              </div>
              
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>{post.author}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="rounded-lg overflow-hidden mb-8">
                  <img  alt={post.title} className="w-full h-auto" src="https://images.unsplash.com/photo-1672870153272-1ce7b03bf04b" />
                </div>
                
                <div 
                  className="prose prose-lg max-w-none blog-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                
                <div className="mt-8 pt-8 border-t">
                  <div className="flex flex-wrap gap-2 mb-8">
                    <Tag className="h-5 w-5 text-gray-500 mr-2" />
                    {post.tags.map((tag, index) => (
                      <Link 
                        key={index}
                        to={`/blog/etiqueta/${tag.toLowerCase().replace(/ /g, '-')}`}
                        className="inline-block bg-gray-100 text-gray-700 hover:bg-primary hover:text-white transition-colors text-sm px-3 py-1 rounded-full"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prevPost && (
                      <Link 
                        to={`/blog/${prevPost.slug}`}
                        className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <span className="text-sm text-gray-500 block">Artículo anterior</span>
                          <span className="font-medium line-clamp-1">{prevPost.title}</span>
                        </div>
                      </Link>
                    )}
                    
                    {nextPost && (
                      <Link 
                        to={`/blog/${nextPost.slug}`}
                        className="flex items-center justify-end p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-right">
                          <span className="text-sm text-gray-500 block">Artículo siguiente</span>
                          <span className="font-medium line-clamp-1">{nextPost.title}</span>
                        </div>
                        <ArrowRight className="h-5 w-5 ml-2 flex-shrink-0" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
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

export default BlogPostPage;