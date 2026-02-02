import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, ChevronRight, Calendar } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAll, Pedido } from '@/lib/db';

export const PedidosPage = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPedidos = async () => {
      try {
        const data = await getAll<Pedido>('pedidos');
        // Ordenar por fecha, más recientes primero
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPedidos(data);
      } catch (error) {
        console.error('Error loading pedidos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPedidos();
  }, []);

  const filteredPedidos = pedidos.filter(
    (pedido) =>
      pedido.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
      pedido.id.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <MobileLayout title="Pedidos">
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por cliente..."
            />
          </div>
          <Button
            onClick={() => navigate('/pedidos/nuevo')}
            className="gradient-primary"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredPedidos.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title={search ? 'Sin resultados' : 'Sin pedidos'}
            description={
              search
                ? 'No se encontraron pedidos con ese criterio'
                : 'Crea tu primer pedido'
            }
            action={
              <Button onClick={() => navigate('/pedidos/nuevo')} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Pedido
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredPedidos.map((pedido) => (
              <Card
                key={pedido.id}
                className="shadow-card cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
                onClick={() => navigate(`/pedidos/${pedido.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={pedido.estado} />
                      </div>
                      <h3 className="font-semibold text-foreground truncate">
                        {pedido.cliente_nombre}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(pedido.created_at)}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-muted-foreground">
                          {pedido.items.length} producto{pedido.items.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(pedido.total)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};
