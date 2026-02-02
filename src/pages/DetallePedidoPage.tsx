import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, AlertCircle, RefreshCw, Trash2, FileText } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getById, deleteItem, Pedido } from '@/lib/db';
import { uploadSinglePedido } from '@/lib/syncService';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const DetallePedidoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const loadPedido = async () => {
      if (!id) return;
      try {
        const data = await getById<Pedido>('pedidos', id);
        setPedido(data || null);
      } catch (error) {
        console.error('Error loading pedido:', error);
        toast.error('Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    loadPedido();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRetrySync = async () => {
    if (!pedido) return;
    setSyncing(true);
    try {
      const result = await uploadSinglePedido(pedido);
      if (result.success) {
        toast.success('Pedido sincronizado correctamente');
        // Recargar el pedido actualizado
        const updated = await getById<Pedido>('pedidos', pedido.id);
        setPedido(updated || null);
      } else {
        toast.error(result.error || 'Error al sincronizar');
      }
    } catch (error) {
      console.error('Error syncing pedido:', error);
      toast.error('Error al sincronizar el pedido');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!pedido) return;
    try {
      await deleteItem('pedidos', pedido.id);
      toast.success('Pedido eliminado');
      navigate('/pedidos');
    } catch (error) {
      console.error('Error deleting pedido:', error);
      toast.error('Error al eliminar el pedido');
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Cargando...">
        <div className="p-4 space-y-4">
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
        </div>
      </MobileLayout>
    );
  }

  if (!pedido) {
    return (
      <MobileLayout title="Pedido no encontrado">
        <div className="p-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Pedido no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El pedido que buscas no existe o fue eliminado.
          </p>
          <Button onClick={() => navigate('/pedidos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Pedidos
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Detalle del Pedido">
      <div className="p-4 space-y-4 pb-32">
        {/* Botón de volver */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/pedidos')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Pedidos
        </Button>
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-warning">Pendiente de sincronizar</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Este pedido aún no se ha subido al servidor. Puedes reintentarlo o eliminarlo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info del cliente */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Cliente</CardTitle>
              <StatusBadge status={pedido.estado} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold text-foreground">{pedido.cliente_nombre}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(pedido.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Lista de productos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos ({pedido.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pedido.items.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.producto_nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.cantidad} x {formatCurrency(item.precio_unitario)}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
                {index < pedido.items.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
            
            <Separator className="my-3" />
            
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold">Total</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(pedido.total)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        {pedido.notas && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{pedido.notas}</p>
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-3 max-w-lg mx-auto">
            {!pedido.sincronizado && (
              <Button 
                onClick={handleRetrySync} 
                disabled={syncing}
                className="flex-1 gradient-primary"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Reintentar Sync'}
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className={pedido.sincronizado ? 'flex-1' : ''}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El pedido será eliminado permanentemente de tu dispositivo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};
