import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Navigation, CheckCircle, Package, Clock, AlertCircle, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChoferLayout } from '@/components/layout/ChoferLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChoferData } from '@/hooks/useChoferData';
import { ESTADO_ENTREGA_LABELS } from '@/types/chofer';
import { cn } from '@/lib/utils';

export const ChoferRutaPage = () => {
  const navigate = useNavigate();
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(new Date());
  
  const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
  const { hojaRuta, paradas, loading } = useChoferData(fechaStr);

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'entregado':
      case 'entrega_parcial':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'rechazado':
      case 'no_entregado':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'en_camino':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'entregado':
      case 'entrega_parcial':
        return 'bg-success text-success-foreground';
      case 'rechazado':
      case 'no_entregado':
        return 'bg-destructive text-destructive-foreground';
      case 'en_camino':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const openMaps = (direccion: string) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`,
      '_blank'
    );
  };

  if (loading) {
    return (
      <ChoferLayout title="Ruta de Entregas">
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </ChoferLayout>
    );
  }

  if (!hojaRuta || paradas.length === 0) {
    return (
      <ChoferLayout title="Ruta de Entregas">
        <div className="p-4 space-y-4">
          {/* Selector de fecha */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal flex-1">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(fechaSeleccionada, "EEEE, d 'de' MMMM", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaSeleccionada}
                  onSelect={(date) => date && setFechaSeleccionada(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <EmptyState
            icon={MapPin}
            title="Sin paradas"
            description={`No hay entregas programadas para ${format(fechaSeleccionada, "d 'de' MMMM", { locale: es })}`}
          />
        </div>
      </ChoferLayout>
    );
  }

  return (
    <ChoferLayout title="Ruta de Entregas">
      <div className="p-4 space-y-4">
        {/* Selector de fecha */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal flex-1">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(fechaSeleccionada, "EEEE, d 'de' MMMM", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fechaSeleccionada}
                onSelect={(date) => date && setFechaSeleccionada(date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Lista de paradas */}
        {paradas.map((parada, index) => {
          const isCompleted = ['entregado', 'entrega_parcial', 'rechazado', 'no_entregado'].includes(parada.estado_entrega);
          
          return (
            <Card
              key={parada.id}
              className={cn(
                "shadow-card transition-all",
                isCompleted && "opacity-70"
              )}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Indicador de orden */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                      getEstadoColor(parada.estado_entrega)
                    )}>
                      {isCompleted ? getEstadoIcon(parada.estado_entrega) : index + 1}
                    </div>
                    {index < paradas.length - 1 && (
                      <div className="w-0.5 flex-1 min-h-[2rem] bg-border mt-2" />
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn(
                        "font-semibold",
                        isCompleted && "line-through text-muted-foreground"
                      )}>
                        {parada.pedido?.cliente_nombre || `Pedido #${parada.pedido_id.slice(0, 8)}`}
                      </h3>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full whitespace-nowrap",
                        isCompleted ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                      )}>
                        {ESTADO_ENTREGA_LABELS[parada.estado_entrega]}
                      </span>
                    </div>

                    {parada.pedido?.cliente_direccion && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{parada.pedido.cliente_direccion}</span>
                      </div>
                    )}

                    {/* Total del pedido */}
                    <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total pedido:</span>
                        <span className="font-semibold">
                          ${(parada.pedido?.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {(parada.monto_cobrado || 0) > 0 && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Cobrado:</span>
                          <span className="font-semibold text-success">
                            ${(parada.monto_cobrado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {parada.pedido?.cliente_telefono && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${parada.pedido?.cliente_telefono}`, '_self')}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Llamar
                        </Button>
                      )}
                      {parada.pedido?.cliente_direccion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMaps(parada.pedido!.cliente_direccion!)}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Navegar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="ml-auto gradient-primary"
                        onClick={() => navigate(`/chofer/entregas/${parada.id}`)}
                      >
                        {isCompleted ? 'Ver detalle' : 'Gestionar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ChoferLayout>
  );
};
