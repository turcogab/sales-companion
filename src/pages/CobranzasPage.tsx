import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus, Calendar, ChevronRight, Banknote, Building2, FileText } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAll, Cobranza } from '@/lib/db';
import { cn } from '@/lib/utils';

const tipoPagoIcons = {
  efectivo: Banknote,
  transferencia: Building2,
  cheque: FileText,
};

const tipoPagoLabels = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
};

export const CobranzasPage = () => {
  const navigate = useNavigate();
  const [cobranzas, setCobranzas] = useState<Cobranza[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCobranzas = async () => {
      try {
        const data = await getAll<Cobranza>('cobranzas');
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setCobranzas(data);
      } catch (error) {
        console.error('Error loading cobranzas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCobranzas();
  }, []);

  const filteredCobranzas = cobranzas.filter(
    (cobranza) =>
      cobranza.cliente_nombre.toLowerCase().includes(search.toLowerCase())
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

  const totalDelDia = cobranzas
    .filter((c) => {
      const today = new Date().toDateString();
      return new Date(c.created_at).toDateString() === today;
    })
    .reduce((sum, c) => sum + c.monto, 0);

  return (
    <MobileLayout title="Cobranzas">
      <div className="p-4 space-y-4">
        {/* Resumen del día */}
        <Card className="shadow-card gradient-success text-success-foreground">
          <CardContent className="p-4">
            <p className="text-sm opacity-90">Cobrado hoy</p>
            <p className="text-2xl font-bold">{formatCurrency(totalDelDia)}</p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por cliente..."
            />
          </div>
          <Button
            onClick={() => navigate('/cobranzas/nueva')}
            className="gradient-primary"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredCobranzas.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={search ? 'Sin resultados' : 'Sin cobranzas'}
            description={
              search
                ? 'No se encontraron cobranzas con ese criterio'
                : 'Registra tu primera cobranza'
            }
            action={
              <Button onClick={() => navigate('/cobranzas/nueva')} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cobranza
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredCobranzas.map((cobranza) => {
              const TipoPagoIcon = tipoPagoIcons[cobranza.tipo_pago];
              return (
                <Card key={cobranza.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded flex items-center gap-1",
                            cobranza.sincronizado
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          )}>
                            {cobranza.sincronizado ? 'Sincronizado' : 'Pendiente'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1">
                            <TipoPagoIcon className="h-3 w-3" />
                            {tipoPagoLabels[cobranza.tipo_pago]}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground truncate">
                          {cobranza.cliente_nombre}
                        </h3>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(cobranza.created_at)}</span>
                        </div>

                        {cobranza.referencia && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Ref: {cobranza.referencia}
                          </p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-success">
                        {formatCurrency(cobranza.monto)}
                      </p>
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
