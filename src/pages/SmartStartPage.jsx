import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Inicio rápido deshabilitado: esta página redirige al inicio principal
const SmartStartPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
};

export default SmartStartPage;
