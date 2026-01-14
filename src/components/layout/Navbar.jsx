import React, { useState, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Users, LayoutDashboard, BarChart3, PlusCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EXIT_URL = import.meta.env.VITE_EXIT_URL || "about:blank";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleExitApp = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage?.clear();
      window.sessionStorage?.clear();
    } catch (error) {
      console.warn("No se pudo limpiar el estado local antes de salir:", error);
    }

    const attemptClose = () => {
      try {
        const win = window.open("", "_self", "");
        win?.close();
      } catch (closeError) {
        console.warn("No se pudo cerrar la ventana directamente:", closeError);
      }
    };

    const navigateAway = () => {
      if (EXIT_URL === "about:blank") {
        window.location.href = "about:blank";
      } else {
        window.location.replace(EXIT_URL);
      }
    };

    attemptClose();
    setTimeout(navigateAway, 100);
  }, []);

  const navLinks = [
    { name: "Inicio", path: "/", icon: <Home size={20} /> },
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Jugadores", path: "/players", icon: <Users size={20} /> },
    { name: "Nueva Velada", path: "/new-game", icon: <PlusCircle size={20} /> },
    { name: "Estadísticas", path: "/stats", icon: <BarChart3 size={20} /> },
  ];

  const schoolLogoUrl = "/escudo-cum.png";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 50, delay: 0.2 }}
      className="sticky top-0 z-50 bg-gradient-to-r from-primary to-blue-700 text-primary-foreground shadow-lg relative"
    >
      <div className="container mx-auto px-4 flex justify-between items-center min-h-[6.5rem] py-2">
        <Link to="/" className="flex items-center space-x-3">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <img src={schoolLogoUrl} alt="Escudo CUM 74" className="h-24 w-auto"/>
          </motion.div>
          <span className="text-xl sm:text-2xl font-bold tracking-wider">Dominó CUM 74</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm lg:text-base transition-colors",
                  isActive ? "bg-primary-foreground/20" : "hover:bg-primary-foreground/10"
                )
              }
            >
              {link.icon}
              <span>{link.name}</span>
            </NavLink>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={handleExitApp}
            className="ml-2 bg-amber-400 text-amber-950 hover:bg-amber-300 font-semibold shadow-sm"
          >
            Salir
          </Button>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-primary-foreground/10"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </Button>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden bg-primary/95 backdrop-blur-sm absolute top-full left-0 right-0 shadow-lg max-h-[72vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom),1rem)]"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={toggleMenu}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-md text-lg font-medium transition-colors hover:bg-primary-foreground/10",
                    isActive ? "bg-primary-foreground/20" : ""
                  )
                }
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            ))}
            <Button
              type="button"
              onClick={() => {
                toggleMenu();
                handleExitApp();
              }}
              className="mt-2 bg-amber-400 text-amber-950 hover:bg-amber-300 font-semibold"
            >
              Salir
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Navbar;