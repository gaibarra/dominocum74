import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHomeData } from "@/components/home/hooks/useHomeData";

const HomePage = () => {
  const { activeGame, isLoading, error } = useHomeData();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (activeGame?.id) {
      navigate(`/game/${activeGame.id}?focus=attendance`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [activeGame?.id, isLoading, navigate]);

  const hasActive = Boolean(activeGame?.id);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-4 text-center bg-card/70 border border-border/60 rounded-2xl shadow-lg p-6">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Dominó CUM 74</p>
        <h1 className="text-2xl font-bold text-foreground">
          {isLoading ? "Verificando velada en curso..." : hasActive ? "Velada activa detectada" : "No hay velada activa"}
        </h1>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Preparando tu sesión...</span>
          </div>
        )}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!hasActive && (
              <Button type="button" className="w-full sm:w-auto" onClick={() => navigate("/dashboard")}> 
                Ir al Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {hasActive && (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => navigate(`/game/${activeGame.id}?focus=attendance`)}
              >
                Registrar Asistencia
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate("/dashboard")}
            >
              Abrir Dashboard
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Esta pantalla solo decide tu destino inicial según haya velada activa. Puedes cambiar de sección en cualquier momento desde el menú.
        </p>
      </div>
    </main>
  );
};

export default HomePage;