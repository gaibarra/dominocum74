import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BlogSidebar = ({ categories, recentPosts, popularTags }) => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {categories.map((category, index) => (
              <li key={index}>
                <Link 
                  to={`/blog/categoria/${category.slug}`}
                  className="flex items-center justify-between text-gray-700 hover:text-primary transition-colors"
                >
                  <span>{category.name}</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Artículos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">Recientes</TabsTrigger>
              <TabsTrigger value="popular">Populares</TabsTrigger>
            </TabsList>
            <TabsContent value="recent" className="mt-4">
              <ul className="space-y-4">
                {recentPosts.map((post, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <img  alt={post.title} className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1623683704451-ca4299bb3c99" />
                    </div>
                    <div>
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="font-medium line-clamp-2 hover:text-primary transition-colors"
                      >
                        {post.title}
                      </Link>
                      <span className="text-xs text-gray-500 block mt-1">
                        {post.date}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="popular" className="mt-4">
              <ul className="space-y-4">
                {recentPosts.slice().reverse().map((post, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <img  alt={post.title} className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1683614549556-a84aa02547a0" />
                    </div>
                    <div>
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="font-medium line-clamp-2 hover:text-primary transition-colors"
                      >
                        {post.title}
                      </Link>
                      <span className="text-xs text-gray-500 block mt-1">
                        {post.date}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Etiquetas Populares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag, index) => (
              <Link 
                key={index}
                to={`/blog/etiqueta/${tag.slug}`}
                className="inline-block bg-gray-100 text-gray-700 hover:bg-primary hover:text-white transition-colors text-sm px-3 py-1 rounded-full"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogSidebar;