import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Phone, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { getAll, Cliente } from '@/lib/db';
import { cn } from '@/lib/utils';

export const ClientesPage = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClientes = async () => {
      try {
        const data = await getAll<Cliente>('clientes');
        setClientes(data);
      } catch (error) {
        console.error('Error loading clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadClientes();
  }, []);

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
      cliente.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <MobileLayout title="Clientes">
      <div className="p-4 space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o código..."
        />

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredClientes.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Sin resultados' : 'Sin clientes'}
            description={
              search
                ? 'No se encontraron clientes con ese criterio'
                : 'Sincroniza para cargar los clientes'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredClientes.map((cliente) => (
              <Card
                key={cliente.id}
                className="shadow-card cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
                onClick={() => navigate(`/clientes/${cliente.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {cliente.codigo}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          cliente.sincronizado
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        )}>
                          {cliente.sincronizado ? 'Sincronizado' : 'Pendiente'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{cliente.nombre}</h3>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{cliente.direccion}</span>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{cliente.telefono}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={cn(
                            cliente.saldo > 0 ? "text-destructive" : "text-success"
                          )}>
                            {formatCurrency(cliente.saldo)}
                          </span>
                        </div>
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
