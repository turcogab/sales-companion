import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, User, Check, Banknote, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet';
import { getAll, put, generateId, Cliente, Cobranza } from '@/lib/db';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TipoPago = 'efectivo' | 'transferencia' | 'cheque';

const tiposPago: { value: TipoPago; label: string; icon: typeof Banknote }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'transferencia', label: 'Transferencia', icon: Building2 },
  { value: 'cheque', label: 'Cheque', icon: FileText },
];

export const NuevaCobranzaPage = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [monto, setMonto] = useState('');
  const [tipoPago, setTipoPago] = useState<TipoPago>('efectivo');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [clienteSheetOpen, setClienteSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadClientes = async () => {
      const data = await getAll<Cliente>('clientes');
      setClientes(data);
    };
    loadClientes();
  }, []);

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.codigo.toLowerCase().includes(searchCliente.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const handleSave = async () => {
    if (!selectedCliente) {
      toast.error('Selecciona un cliente');
      return;
    }
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setSaving(true);
    try {
      const cobranza: Cobranza = {
        id: generateId(),
        cliente_id: selectedCliente.id,
        cliente_nombre: selectedCliente.nombre,
        monto: montoNum,
        tipo_pago: tipoPago,
        referencia: referencia || undefined,
        notas: notas || undefined,
        created_at: new Date().toISOString(),
        sincronizado: false,
      };

      await put('cobranzas', cobranza);
      toast.success('Cobranza registrada');
      navigate('/cobranzas');
    } catch (error) {
      console.error('Error saving cobranza:', error);
      toast.error('Error al guardar la cobranza');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="gradient-header text-primary-foreground sticky top-0 z-50 safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold">Nueva Cobranza</h1>
        </div>
      </header>

      <main className="flex-1 pb-32 overflow-auto">
        <div className="p-4 space-y-6">
          {/* Selección de cliente */}
          <Sheet open={clienteSheetOpen} onOpenChange={setClienteSheetOpen}>
            <SheetTrigger asChild>
              <Card className="shadow-card cursor-pointer hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      {selectedCliente ? (
                        <>
                          <p className="font-medium text-foreground">{selectedCliente.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            Saldo: {formatCurrency(selectedCliente.saldo)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-foreground">Seleccionar cliente</p>
                          <p className="text-sm text-muted-foreground">Toca para elegir</p>
                        </>
                      )}
                    </div>
                    {selectedCliente && (
                      <Check className="h-5 w-5 text-success" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Seleccionar Cliente</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchCliente}
                    onChange={(e) => setSearchCliente(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {filteredClientes.map((cliente) => (
                    <button
                      key={cliente.id}
                      onClick={() => {
                        setSelectedCliente(cliente);
                        setClienteSheetOpen(false);
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        selectedCliente?.id === cliente.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{cliente.nombre}</p>
                          <p className="text-sm text-muted-foreground">{cliente.codigo}</p>
                        </div>
                        <p className={cn(
                          "font-semibold",
                          cliente.saldo > 0 ? "text-destructive" : "text-success"
                        )}>
                          {formatCurrency(cliente.saldo)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Monto */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="pl-8 text-xl font-semibold h-14"
              />
            </div>
          </div>

          {/* Tipo de pago */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {tiposPago.map((tipo) => {
                const Icon = tipo.icon;
                const isSelected = tipoPago === tipo.value;
                return (
                  <button
                    key={tipo.value}
                    onClick={() => setTipoPago(tipo.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Icon className={cn(
                      "h-6 w-6",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}>
                      {tipo.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Referencia (para transferencia y cheque) */}
          {tipoPago !== 'efectivo' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {tipoPago === 'transferencia' ? 'Número de transferencia' : 'Número de cheque'}
              </label>
              <Input
                placeholder={tipoPago === 'transferencia' ? 'Ej: 123456789' : 'Ej: 00012345'}
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
              />
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Notas (opcional)</label>
            <Textarea
              placeholder="Agregar observaciones..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>
      </main>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 safe-bottom">
        <Button
          className="w-full gradient-success h-12 text-base"
          disabled={!selectedCliente || !monto || saving}
          onClick={handleSave}
        >
          {saving ? 'Guardando...' : 'Registrar Cobranza'}
        </Button>
      </div>
    </div>
  );
};
