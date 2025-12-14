import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  Building,
  Home,
  User,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";

const ContactForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyType: "",
    message: ""
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulación de envío de formulario
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Formulario enviado",
        description: "Nos pondremos en contacto con usted a la brevedad.",
        variant: "default",
      });
      
      // Resetear formulario
      setFormData({
        name: "",
        email: "",
        phone: "",
        propertyType: "",
        message: ""
      });
    }, 1500);
  };
  
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-6">Contáctenos</h2>
            <p className="text-lg text-gray-600 mb-8">
              Estamos listos para ayudarle con sus necesidades de valuación. 
              Complete el formulario y nos pondremos en contacto con usted a la brevedad.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">Dirección</h4>
                  <p className="text-gray-600">
                    Av. Principal 123, Col. Centro<br />
                    Ciudad de México, CP 06000<br />
                    México
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">Email</h4>
                  <p className="text-gray-600">
                    contacto@arquivalor.com<br />
                    info@arquivalor.com
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">Teléfono</h4>
                  <p className="text-gray-600">
                    +52 55 1234 5678<br />
                    +52 55 8765 4321
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg overflow-hidden h-64 shadow-md">
              {/* Aquí iría un mapa, pero por ahora usamos una imagen */}
              <img  alt="Mapa de ubicación de la oficina" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1591692401141-ce785764c04b" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <h3 className="text-2xl font-bold mb-6">Solicite una Valuación</h3>
            
            <Form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Su nombre completo"
                        className="pl-10"
                        required
                      />
                    </div>
                  </FormControl>
                </FormItem>
                
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Su correo electrónico"
                        className="pl-10"
                        required
                      />
                    </div>
                  </FormControl>
                </FormItem>
                
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Su número telefónico"
                        className="pl-10"
                        required
                      />
                    </div>
                  </FormControl>
                </FormItem>
                
                <FormItem>
                  <FormLabel>Tipo de Propiedad</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-3">
                        {formData.propertyType === "business" ? (
                          <Building className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Home className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <select
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Seleccione tipo de propiedad</option>
                        <option value="residential">Residencial</option>
                        <option value="commercial">Comercial</option>
                        <option value="industrial">Industrial</option>
                        <option value="land">Terreno</option>
                        <option value="business">Empresa/Negocio</option>
                      </select>
                    </div>
                  </FormControl>
                </FormItem>
                
                <FormItem>
                  <FormLabel>Mensaje</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Describa brevemente su necesidad de valuación"
                        className="pl-10 min-h-[120px]"
                        required
                      />
                    </div>
                  </FormControl>
                </FormItem>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Enviar Solicitud
                      <Send className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </Form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;