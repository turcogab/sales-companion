import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Navigation, CheckCircle, Circle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAll, Cliente } from '@/lib/db';
import { cn } from '@/lib/utils';

export const RutaPage = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [visitados, setVisitados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClientes = async () => {
      try {
        const data = await getAll<Cliente>('clientes');
        // Ordenar por orden de ruta
        data.sort((a, b) => (a.orden_ruta || 999) - (b.orden_ruta || 999));
        setClientes(data);
      } catch (error) {
        console.error('Error loading clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadClientes();
  }, []);

  const toggleVisitado = (id: string) => {
    const newVisitados = new Set(visitados);
    if (newVisitados.has(id)) {
      newVisitados.delete(id);
    } else {
      newVisitados.add(id);
    }
    setVisitados(newVisitados);
  };

  const openMaps = (cliente: Cliente) => {
    if (cliente.latitud && cliente.longitud) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${cliente.latitud},${cliente.longitud}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.direccion)}`,
        '_blank'
      );
    }
  };

  const progreso = clientes.length > 0 
    ? Math.round((visitados.size / clientes.length) * 100) 
    : 0;

  return (
    <MobileLayout title="Ruta del Día">
      <div className="p-4 space-y-4">
        {/* Progreso */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progreso del día</span>
              <span className="text-sm text-muted-foreground">
                {visitados.size} de {clientes.length} clientes
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : clientes.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Sin ruta definida"
            description="Sincroniza para cargar la ruta de visitas del día"
          />
        ) : (
          <div className="space-y-3">
            {clientes.map((cliente, index) => {
              const isVisitado = visitados.has(cliente.id);
              return (
                <Card
                  key={cliente.id}
                  className={cn(
                    "shadow-card transition-all",
                    isVisitado && "opacity-60 bg-muted/50"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {/* Indicador de orden */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => toggleVisitado(cliente.id)}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            isVisitado
                              ? "bg-success text-success-foreground"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {isVisitado ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <span className="font-semibold">{index + 1}</span>
                          )}
                        </button>
                        {index < clientes.length - 1 && (
                          <div className="w-0.5 h-full min-h-[3rem] bg-border mt-2" />
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-semibold truncate",
                          isVisitado ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {cliente.nombre}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {cliente.codigo}
                        </p>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{cliente.direccion}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${cliente.telefono}`, '_self')}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Llamar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMaps(cliente)}
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Navegar
                          </Button>
                          <Button
                            size="sm"
                            className="gradient-primary ml-auto"
                            onClick={() => navigate(`/pedidos/nuevo?cliente=${cliente.id}`)}
                          >
                            Tomar pedido
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};
