import { ChoferLayout } from '@/components/layout/ChoferLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChoferData } from '@/hooks/useChoferData';
import { ESTADO_ENTREGA_LABELS } from '@/types/chofer';
import { cn } from '@/lib/utils';
import { Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ChoferEntregasPage = () => {
  const navigate = useNavigate();
  const { paradas, loading } = useChoferData();

  const entregadas = paradas.filter(p => p.estado_entrega === 'entregado');
  const parciales = paradas.filter(p => p.estado_entrega === 'entrega_parcial');
  const pendientes = paradas.filter(p => ['pendiente', 'en_camino'].includes(p.estado_entrega));
  const noEntregadas = paradas.filter(p => ['rechazado', 'no_entregado'].includes(p.estado_entrega));

  const EntregaItem = ({ parada, onClick }: { parada: typeof paradas[0], onClick: () => void }) => (
    <div 
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {parada.pedido?.cliente_nombre || `Pedido #${parada.pedido_id.slice(0, 8)}`}
        </p>
        <p className="text-sm text-muted-foreground">
          ${(parada.pedido?.total || 0).toLocaleString('es-AR')}
        </p>
      </div>
      <span className="text-sm text-muted-foreground">
        {ESTADO_ENTREGA_LABELS[parada.estado_entrega]}
      </span>
    </div>
  );

  if (loading) {
    return (
      <ChoferLayout title="Entregas">
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </ChoferLayout>
    );
  }

  return (
    <ChoferLayout title="Entregas">
      <div className="p-4 space-y-4">
        {/* Resumen rápido */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="shadow-card">
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto text-warning" />
              <p className="text-xl font-bold mt-1">{pendientes.length}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-3 text-center">
              <CheckCircle className="h-5 w-5 mx-auto text-success" />
              <p className="text-xl font-bold mt-1">{entregadas.length}</p>
              <p className="text-xs text-muted-foreground">Entregadas</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-3 text-center">
              <Package className="h-5 w-5 mx-auto text-primary" />
              <p className="text-xl font-bold mt-1">{parciales.length}</p>
              <p className="text-xs text-muted-foreground">Parciales</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-3 text-center">
              <XCircle className="h-5 w-5 mx-auto text-destructive" />
              <p className="text-xl font-bold mt-1">{noEntregadas.length}</p>
              <p className="text-xs text-muted-foreground">No entreg.</p>
            </CardContent>
          </Card>
        </div>

        {/* Pendientes */}
        {pendientes.length > 0 && (
          <Card className="shadow-card border-warning/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Pendientes ({pendientes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendientes.map(parada => (
                <EntregaItem 
                  key={parada.id} 
                  parada={parada}
                  onClick={() => navigate(`/chofer/entregas/${parada.id}`)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Entregadas */}
        {entregadas.length > 0 && (
          <Card className="shadow-card border-success/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Entregadas ({entregadas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entregadas.map(parada => (
                <EntregaItem 
                  key={parada.id} 
                  parada={parada}
                  onClick={() => navigate(`/chofer/entregas/${parada.id}`)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Parciales */}
        {parciales.length > 0 && (
          <Card className="shadow-card border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Entregas Parciales ({parciales.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {parciales.map(parada => (
                <EntregaItem 
                  key={parada.id} 
                  parada={parada}
                  onClick={() => navigate(`/chofer/entregas/${parada.id}`)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* No entregadas */}
        {noEntregadas.length > 0 && (
          <Card className="shadow-card border-destructive/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                No Entregadas ({noEntregadas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {noEntregadas.map(parada => (
                <EntregaItem 
                  key={parada.id} 
                  parada={parada}
                  onClick={() => navigate(`/chofer/entregas/${parada.id}`)}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ChoferLayout>
  );
};
