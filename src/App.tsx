import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { initDB } from "@/lib/db";

import { HomePage } from "@/pages/HomePage";
import { ClientesPage } from "@/pages/ClientesPage";
import { ProductosPage } from "@/pages/ProductosPage";
import { PedidosPage } from "@/pages/PedidosPage";
import { NuevoPedidoPage } from "@/pages/NuevoPedidoPage";
import { DetallePedidoPage } from "@/pages/DetallePedidoPage";
import { RutaPage } from "@/pages/RutaPage";
import { CobranzasPage } from "@/pages/CobranzasPage";
import { NuevaCobranzaPage } from "@/pages/NuevaCobranzaPage";
import { AuthPage } from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Páginas de Chofer/Camionero
import { 
  ChoferHomePage, 
  ChoferRutaPage, 
  ChoferEntregasPage, 
  DetalleEntregaPage,
  RendicionPage 
} from "@/pages/chofer";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Inicializar IndexedDB al cargar la app
    initDB().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/pedidos/nuevo" element={<NuevoPedidoPage />} />
            <Route path="/pedidos/:id" element={<DetallePedidoPage />} />
            <Route path="/ruta" element={<RutaPage />} />
            <Route path="/cobranzas" element={<CobranzasPage />} />
            <Route path="/cobranzas/nueva" element={<NuevaCobranzaPage />} />
            
            {/* Rutas de Chofer/Camionero - Protegidas */}
            <Route path="/chofer" element={
              <ProtectedRoute>
                <ChoferHomePage />
              </ProtectedRoute>
            } />
            <Route path="/chofer/ruta" element={
              <ProtectedRoute>
                <ChoferRutaPage />
              </ProtectedRoute>
            } />
            <Route path="/chofer/entregas" element={
              <ProtectedRoute>
                <ChoferEntregasPage />
              </ProtectedRoute>
            } />
            <Route path="/chofer/entregas/:id" element={
              <ProtectedRoute>
                <DetalleEntregaPage />
              </ProtectedRoute>
            } />
            <Route path="/chofer/rendicion" element={
              <ProtectedRoute>
                <RendicionPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
