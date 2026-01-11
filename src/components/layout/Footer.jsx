import React from "react";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const schoolLogoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/8390fc1c-d162-40c7-811e-c73fb2452611/e21b65fb452d3ab523dca46fd333b926.webp";
  
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-slate-800 text-slate-300 py-8 border-t-2 border-primary"
    >
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center space-x-2 mb-3">
          <img src={schoolLogoUrl} alt="Escudo CUM" className="h-8 w-auto" />
          <span className="font-semibold text-slate-100">Dominó CUM 74</span>
        </div>
        <p className="text-sm">
          &copy; {currentYear} Dominó CUM 74. Para la generación 1974 del Centro Universitario Montejo.
        </p>
        <p className="text-xs mt-1 text-slate-400">
          Una aplicación para llevar el registro de tus épicas partidas de dominó.
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;