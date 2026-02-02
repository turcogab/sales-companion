import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, ShoppingCart, MapPin, CreditCard, 
  RefreshCw, CloudOff, CheckCircle, AlertCircle 
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuth } from '@/hooks/useAuth';
import { fullSync } from '@/lib/syncService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const quickActions = [
  { path: '/clientes', icon: Users, label: 'Clientes', color: 'bg-primary' },
  { path: '/productos', icon: Package, label: 'Productos', color: 'bg-accent' },
  { path: '/pedidos/nuevo', icon: ShoppingCart, label: 'Nuevo Pedido', color: 'bg-success' },
  { path: '/cobranzas/nueva', icon: CreditCard, label: 'Cobranza', color: 'bg-warning' },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const { status, loading, refresh, pendingCount } = useSyncStatus();
  const isOnline = useOnlineStatus();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [syncing, setSyncing] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Sin conexión a internet');
      return;
    }
    
    setSyncing(true);
    try {
      const result = await fullSync();
      
      if (result.success) {
        toast.success(
          `Sincronizado: ${result.downloaded.clientes} clientes, ${result.downloaded.productos} productos`
        );
      } else {
        toast.error(`Errores: ${result.errors.join(', ')}`);
      }
      
      await refresh();
    } catch (error) {
      toast.error('Error al sincronizar');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <MobileLayout title="Preventista">
      <div className="p-4 space-y-6">
        {/* Estado de sincronización */}
        <Card className={cn(
          "shadow-card overflow-hidden",
          isOnline ? "border-success/30" : "border-warning/30"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <CloudOff className="h-5 w-5 text-warning" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {isOnline ? 'Conectado' : 'Modo Offline'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pendingCount > 0
                      ? `${pendingCount} elemento${pendingCount > 1 ? 's' : ''} por sincronizar`
                      : 'Todo sincronizado'}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleSync}
                disabled={!isOnline || syncing}
                className="gradient-primary"
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", syncing && "animate-spin")} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>

            {status?.lastSync && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                Última sincronización: {new Date(status.lastSync).toLocaleString('es-AR')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl shadow-card border border-border hover:border-primary/30 transition-all active:scale-95"
                >
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", action.color)}>
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumen */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Resumen
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{status?.clientes.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Clientes</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{status?.productos.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Productos</p>
                  </div>
                  <Package className="h-8 w-8 text-accent/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{status?.pedidos.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Pedidos</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-success/30" />
                </div>
                {status?.pedidos.pendientes ? (
                  <p className="text-xs text-warning mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {status.pedidos.pendientes} pendientes
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{status?.cobranzas.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Cobranzas</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-warning/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ruta del día */}
        <Card 
          className="shadow-card cursor-pointer hover:border-primary/30 transition-all"
          onClick={() => navigate('/ruta')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Ruta del Día</h3>
                <p className="text-sm text-muted-foreground">Ver orden de visitas</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{status?.clientes.total || 0}</p>
                <p className="text-xs text-muted-foreground">clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};
