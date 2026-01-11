import React, { Suspense, lazy } from "react";
import { HashRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ActiveVeladaProvider, useActiveVelada } from "@/context/ActiveVeladaContext";
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const PlayersPage = lazy(() => import("@/pages/PlayersPage"));
const NewGamePage = lazy(() => import("@/pages/NewGamePage"));
const GamePage = lazy(() => import("@/pages/GamePage"));
const StatsPage = lazy(() => import("@/pages/StatsPage"));

const App = () => {
  const schoolShieldUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/8390fc1c-d162-40c7-811e-c73fb2452611/9d6de8cdb2099090d32031c87e4df3ef.webp";

  const routerFutureFlags = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  };

  return (
    <ActiveVeladaProvider>
      <Router future={routerFutureFlags}>
        <TooltipProvider>
          <div 
            className="flex flex-col min-h-screen bg-gradient-to-br from-background to-blue-50 dark:from-background dark:to-slate-900 relative"
          >
            <div 
              className="absolute inset-0 bg-no-repeat bg-center bg-contain opacity-5 dark:opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: `url(${schoolShieldUrl})`, backgroundSize: '50% auto' }}
            ></div>
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
          <Suspense fallback={<div className="container mx-auto px-4 py-10">Cargando…</div>}>
                  <Routes>
                    <Route path="/" element={<LandingRedirect />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/players" element={<PlayersPage />} />
                    <Route path="/new-game" element={<NewGamePage />} />
                    <Route path="/game/:gameId" element={<GamePage />} />
                    <Route path="/stats" element={<StatsPage />} />
                    <Route path="*" element={<LandingRedirect />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
            <Toaster />
          </div>
        </TooltipProvider>
      </Router>
    </ActiveVeladaProvider>
  );
};

export default App;

const LandingRedirect = () => {
  const { activeGame, loading, refreshActiveGame } = useActiveVelada();
  const navigate = useNavigate();
  const hasNavigatedRef = React.useRef(false);

  React.useEffect(() => {
    if (!loading && !activeGame && typeof refreshActiveGame === "function") {
      refreshActiveGame();
    }
  }, [activeGame, loading, refreshActiveGame]);

  React.useEffect(() => {
    if (loading) return;
    if (hasNavigatedRef.current) return;

    const params = new URLSearchParams();
    params.set("focus", "attendance");
    params.set("register", "auto");

    if (activeGame?.id) {
      navigate(`/game/${activeGame.id}?${params.toString()}`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
    hasNavigatedRef.current = true;
  }, [activeGame?.id, loading, navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden />
      <div>
        <p className="text-base font-semibold">Dirigiendo tu sesión…</p>
        <p className="text-sm text-muted-foreground">
          {loading ? "Buscando veladas activas" : "Preparando el panel de veladas"}
        </p>
      </div>
    </div>
  );
};