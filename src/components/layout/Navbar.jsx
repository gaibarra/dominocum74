import React, { useState, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Users,
  LayoutDashboard,
  BarChart3,
  PlusCircle,
  CalendarDays,
  MapPin,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  LogOut,
  Eye,
  RefreshCw,
  FileDown,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActiveVelada } from "@/context/ActiveVeladaContext";

const EXIT_URL = import.meta.env.VITE_EXIT_URL || "about:blank";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const { summary: activeVeladaSummary } = useActiveVelada() || {};

  const fallbackVelada = React.useMemo(
    () => ({
      title: "Sin velada activa",
      status: "Sin estado",
      location: "Ubicación pendiente",
      present: 0,
      bench: 0,
    }),
    []
  );

  const activeVelada = activeVeladaSummary || fallbackVelada;
  const hasActiveVelada = Boolean(activeVeladaSummary);

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

    const headerActions = React.useMemo(
      () => [
    {
      label: "Finalizar Velada",
      icon: CheckSquare,
      type: "link",
      path: "/dashboard?focus=closing",
      className: "border-emerald-500 text-emerald-100 hover:bg-emerald-500/20",
    },
    {
      label: "Ver Mesas Finalizadas",
      icon: Eye,
      type: "link",
      path: "/dashboard?tab=finished",
      className: "border-indigo-400 text-indigo-100 hover:bg-indigo-500/20",
    },
    {
      label: "Actualizar",
      icon: RefreshCw,
      type: "action",
      onClick: () => window.location.reload(),
      className: "border-white/40 text-white hover:bg-white/10",
    },
    {
      label: "Descargar PDF",
      icon: FileDown,
      type: "link",
      path: "/stats",
      className: "border-amber-400 text-amber-100 hover:bg-amber-400/20",
    },
      ],
      []
    );

    const navSections = React.useMemo(
      () => [
        {
          label: "Veladas",
          description: "Gestiona partidas, mesas y reportes.",
          icon: CalendarDays,
          accent: "from-rose-500 via-orange-500 to-amber-500",
          highlight: hasActiveVelada
            ? {
                title: activeVelada.title,
                status: activeVelada.status,
                location: activeVelada.location,
                present: activeVelada.present,
                bench: activeVelada.bench,
                actions: headerActions,
              }
            : null,
          links: [
            {
              name: "Dashboard",
              path: "/dashboard",
              description: "Supervisa progreso y cierres.",
              icon: LayoutDashboard,
            },
            {
              name: "Nueva Velada",
              path: "/new-game",
              description: "Abre mesas y asigna parejas.",
              icon: PlusCircle,
            },
            {
              name: "Estadísticas",
              path: "/stats",
              description: "Resultados históricos y PDFs.",
              icon: BarChart3,
            },
          ],
        },
        {
          label: "Jugadores",
          description: "Control de asistencia y banca.",
          icon: Users,
          accent: "from-emerald-500 via-teal-500 to-cyan-500",
          links: [
            {
              name: "Listado",
              path: "/players",
              description: "Perfiles y contacto.",
              icon: Users,
            },
            {
              name: "Panel de Asistencia",
              path: "/dashboard?focus=attendance",
              description: "Check-in en vivo.",
              icon: ClipboardList,
            },
          ],
        },
      ],
      [activeVelada, headerActions, hasActiveVelada]
    );

  const schoolLogoUrl = "/escudo-cum.png";

    return (
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 50, delay: 0.2 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-primary to-blue-700 text-primary-foreground shadow-lg"
      >
        <div className="container mx-auto px-3 sm:px-4 flex justify-between items-center min-h-[4.5rem] sm:min-h-[5.5rem] py-2">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <img src={schoolLogoUrl} alt="Escudo CUM 74" className="h-14 w-auto sm:h-20" />
              </motion.div>
              <span className="text-lg sm:text-2xl font-bold tracking-wider leading-tight">Dominó CUM 74</span>
            </Link>
            {hasActiveVelada && (
              <div className="hidden md:flex flex-col text-xs text-white/70">
                <span className="uppercase tracking-[0.3em] text-white/60">Velada activa</span>
                <span className="text-white text-sm font-semibold">{activeVelada.title}</span>
                <span className="text-white/80">
                  Presentes: {activeVelada.present} • Libres: {activeVelada.bench}
                </span>
              </div>
            )}
          </div>

        <nav className="hidden md:flex items-center space-x-2 relative">
          {navSections.map((section) => {
            const SectionIcon = section.icon;
            return (
              <div
                key={section.label}
                className="relative"
                onMouseEnter={() => setOpenSection(section.label)}
                onMouseLeave={() => setOpenSection(null)}
              >
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    openSection === section.label ? "bg-primary-foreground/20" : "hover:bg-primary-foreground/10"
                  )}
                  onClick={() => setOpenSection((prev) => (prev === section.label ? null : section.label))}
                >
                  <SectionIcon className="h-4 w-4" />
                  <span>{section.label}</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openSection === section.label && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {openSection === section.label && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1/2 top-[calc(100%+0.5rem)] -translate-x-1/2 min-w-[320px]"
                      >
                        <div
                          className={cn(
                            "rounded-2xl border border-white/20 bg-white/95 text-slate-900 shadow-2xl backdrop-blur dark:bg-slate-900/95 dark:text-white",
                            "p-4"
                          )}
                        >
                          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            {section.description}
                          </p>
                          {section.highlight && (
                            <div className="mt-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/60 p-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-xs uppercase text-slate-500 dark:text-slate-300 tracking-[0.2em]">
                                      Velada activa
                                    </p>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                                      {section.highlight.title}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-300 flex items-center gap-2 mt-1">
                                      <MapPin className="h-4 w-4" />
                                      {section.highlight.location}
                                    </p>
                                  </div>
                                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                                    {section.highlight.status}
                                  </span>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-200">
                                  Presentes: {section.highlight.present} • Libres: {section.highlight.bench}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {section.highlight.actions?.map((action) => {
                                    const ActionIcon = action.icon;
                                    if (action.type === "link") {
                                      return (
                                        <Button
                                          key={action.label}
                                          variant="outline"
                                          size="sm"
                                          className={cn("backdrop-blur border", action.className)}
                                          asChild
                                        >
                                          <Link to={action.path} onClick={() => setOpenSection(null)}>
                                            <ActionIcon className="mr-2 h-4 w-4" />
                                            {action.label}
                                          </Link>
                                        </Button>
                                      );
                                    }
                                    return (
                                      <Button
                                        key={action.label}
                                        variant="outline"
                                        size="sm"
                                        className={cn("backdrop-blur border", action.className)}
                                        onClick={action.onClick}
                                      >
                                        <ActionIcon className="mr-2 h-4 w-4" />
                                        {action.label}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="mt-3 flex flex-col gap-2">
                          {section.links.map((link) => {
                            const LinkIcon = link.icon;
                            return (
                              <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => setOpenSection(null)}
                                className={({ isActive }) =>
                                  cn(
                                    "flex items-start gap-3 rounded-xl border border-transparent px-3 py-2 transition-colors",
                                    isActive ? "border-primary text-primary" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                  )
                                }
                              >
                                <span className="mt-1">
                                  <LinkIcon className="h-4 w-4" />
                                </span>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{link.name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-300">{link.description}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          <Button
            type="button"
            size="sm"
            onClick={handleExitApp}
            className="ml-2 bg-amber-400 text-amber-950 hover:bg-amber-300 font-semibold shadow-sm flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Salir
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
          className="md:hidden bg-primary/95 backdrop-blur-sm absolute top-full left-0 right-0 shadow-lg"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            {navSections.map((section) => {
              const SectionIcon = section.icon;
              return (
                <div key={section.label} className="rounded-2xl border border-white/10 bg-primary-foreground/10">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 text-lg font-semibold"
                    onClick={() =>
                      setExpandedSection((prev) => (prev === section.label ? null : section.label))
                    }
                  >
                    <span className="flex items-center gap-3">
                      <SectionIcon className="h-5 w-5" />
                      {section.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 transition-transform",
                        expandedSection === section.label && "rotate-180"
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedSection === section.label && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-4 pb-4 space-y-2"
                      >
                        {section.highlight && (
                          <div className="rounded-2xl border border-white/20 bg-primary-foreground/5 p-4 text-sm">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Velada activa</p>
                            <p className="text-lg font-semibold text-white mt-1">{section.highlight.title}</p>
                            <p className="text-white/80 text-sm flex items-center gap-2 mt-1">
                              <MapPin className="h-4 w-4" />
                              {section.highlight.location}
                            </p>
                            <p className="text-white/80 mt-2">
                              Presentes: {section.highlight.present} • Libres: {section.highlight.bench}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {section.highlight.actions?.map((action) => {
                                const ActionIcon = action.icon;
                                if (action.type === "link") {
                                  return (
                                    <Button
                                      key={action.label}
                                      variant="outline"
                                      size="sm"
                                      className={cn("backdrop-blur border", action.className)}
                                      asChild
                                    >
                                      <Link
                                        to={action.path}
                                        onClick={() => {
                                          toggleMenu();
                                          setExpandedSection(null);
                                        }}
                                      >
                                        <ActionIcon className="mr-2 h-4 w-4" />
                                        {action.label}
                                      </Link>
                                    </Button>
                                  );
                                }
                                return (
                                  <Button
                                    key={action.label}
                                    variant="outline"
                                    size="sm"
                                    className={cn("backdrop-blur border", action.className)}
                                    onClick={() => {
                                      action.onClick?.();
                                      toggleMenu();
                                      setExpandedSection(null);
                                    }}
                                  >
                                    <ActionIcon className="mr-2 h-4 w-4" />
                                    {action.label}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {section.links.map((link) => {
                          const LinkIcon = link.icon;
                          return (
                            <NavLink
                              key={link.path}
                              to={link.path}
                              onClick={() => {
                                toggleMenu();
                                setExpandedSection(null);
                              }}
                              className={({ isActive }) =>
                                cn(
                                  "flex items-start gap-3 rounded-xl px-3 py-2 text-base",
                                  isActive ? "bg-primary-foreground/20" : "hover:bg-primary-foreground/10"
                                )
                              }
                            >
                              <LinkIcon className="h-5 w-5 mt-1" />
                              <div className="flex-1">
                                <p className="font-semibold">{link.name}</p>
                                <p className="text-sm text-primary-foreground/80">{link.description}</p>
                              </div>
                            </NavLink>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            <Button
              type="button"
              onClick={() => {
                toggleMenu();
                handleExitApp();
              }}
              className="mt-1 bg-amber-400 text-amber-950 hover:bg-amber-300 font-semibold"
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