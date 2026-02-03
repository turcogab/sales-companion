import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  RotateCcw,
  Phone,
  MapPin,
  Navigation,
  ShoppingBag
} from 'lucide-react';
import { ChoferLayout } from '@/components/layout/ChoferLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useChoferData } from '@/hooks/useChoferData';
import { 
  ESTADO_ENTREGA_LABELS, 
  MEDIO_PAGO_LABELS, 
  MOTIVO_DEVOLUCION_LABELS,
  EstadoEntrega,
  MedioPago,
  MotivoDevolucion,
  HojaRutaParada
} from '@/types/chofer';
import { cn } from '@/lib/utils';

export const DetalleEntregaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actualizarEstadoEntrega, registrarCobro, registrarDevolucion } = useChoferData();
  
  const [parada, setParada] = useState<HojaRutaParada | null>(null);
  const [loading, setLoading] = useState(true);
  const [cobroDialogOpen, setCobroDialogOpen] = useState(false);
  const [devolucionDialogOpen, setDevolucionDialogOpen] = useState(false);
  
  // Estado para cobro
  const [cobroMonto, setCobroMonto] = useState('');
  const [cobroMedioPago, setCobroMedioPago] = useState<MedioPago>('efectivo');
  const [cobroReferencia, setCobroReferencia] = useState('');
  const [cobroBanco, setCobroBanco] = useState('');
  const [cobroNumeroCheque, setCobroNumeroCheque] = useState('');
  
  // Estado para devolución
  const [devProductoId, setDevProductoId] = useState('');
  const [devCantidad, setDevCantidad] = useState('');
  const [devMotivo, setDevMotivo] = useState<MotivoDevolucion>('producto_danado');
  const [devDetalle, setDevDetalle] = useState('');

  // Cargar la parada directamente por ID
  const loadParada = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabase');
      
      // Cargar parada con cobros y devoluciones
      const { data, error } = await supabase
        .from('hoja_ruta_paradas')
        .select(`
          *,
          cobros(*),
          devoluciones(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        const cobros = data.cobros || [];
        const monto_cobrado = cobros.reduce((sum: number, c: any) => sum + Number(c.monto), 0);
        
        // Cargar datos del pedido - consultas separadas para mayor compatibilidad
        let pedidoData = null;
        if (data.pedido_id) {
          // Obtener pedido básico
          const { data: pedido } = await supabase
            .from('pedidos')
            .select('*')
            .eq('id', data.pedido_id)
            .maybeSingle();
          
          if (pedido) {
            // Obtener cliente si existe cliente_id
            let clienteNombre = 'Cliente';
            let clienteDireccion = '';
            let clienteTelefono = '';
            
            if (pedido.cliente_id) {
              const { data: cliente } = await supabase
                .from('clientes')
                .select('nombre, direccion, telefono')
                .eq('id', pedido.cliente_id)
                .maybeSingle();
              
              if (cliente) {
                clienteNombre = cliente.nombre || 'Cliente';
                clienteDireccion = cliente.direccion || '';
                clienteTelefono = cliente.telefono || '';
              }
            }
            
            // Obtener detalles del pedido con nombres de productos
            const { data: detalles } = await supabase
              .from('pedido_detalles')
              .select('producto_id, cantidad_pedida, precio_unitario, subtotal')
              .eq('pedido_id', data.pedido_id);
            
            // Obtener nombres de productos
            const productIds = (detalles || []).map((d: any) => d.producto_id).filter(Boolean);
            let productosMap: Record<string, string> = {};
            
            if (productIds.length > 0) {
              const { data: productos, error: productosError } = await supabase
                .from('productos')
                .select('id, descripcion')
                .in('id', productIds);
              
              if (productos && productos.length > 0) {
                productosMap = productos.reduce((acc: Record<string, string>, p: any) => {
                  acc[p.id] = p.descripcion || 'Sin nombre';
                  return acc;
                }, {});
              }
            }
            
            pedidoData = {
              id: pedido.id,
              cliente_nombre: clienteNombre,
              cliente_direccion: clienteDireccion,
              cliente_telefono: clienteTelefono,
              total: pedido.total || 0,
              items: (detalles || []).map((d: any) => ({
                producto_id: d.producto_id,
                producto_nombre: productosMap[d.producto_id] || 'Producto',
                cantidad: d.cantidad_pedida,
                precio_unitario: d.precio_unitario,
                subtotal: d.subtotal,
              })),
            };
          }
        }
        
        // La tabla externa usa 'estado' en lugar de 'estado_entrega'
        setParada({ 
          ...data, 
          estado_entrega: data.estado || data.estado_entrega || 'pendiente',
          monto_cobrado,
          pedido: pedidoData,
        } as HojaRutaParada);
      }
    } catch (err) {
      console.error('Error loading parada:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParada();
  }, [id]);

  const handleEstadoChange = async (nuevoEstado: EstadoEntrega) => {
    if (!parada) return;
    const success = await actualizarEstadoEntrega(parada.id, nuevoEstado);
    if (success) {
      setParada({ ...parada, estado_entrega: nuevoEstado });
    }
  };

  const handleRegistrarCobro = async () => {
    if (!parada || !cobroMonto) return;
    
    const monto = parseFloat(cobroMonto);
    if (isNaN(monto) || monto <= 0) return;

    const result = await registrarCobro(
      parada.id,
      monto,
      cobroMedioPago,
      {
        referencia: cobroReferencia || undefined,
        banco: cobroBanco || undefined,
        numero_cheque: cobroNumeroCheque || undefined,
      }
    );

    if (result) {
      setCobroDialogOpen(false);
      resetCobroForm();
      loadParada(); // Recargar datos
    }
  };

  const handleRegistrarDevolucion = async () => {
    if (!parada || !devProductoId || !devCantidad) return;
    
    const cantidad = parseInt(devCantidad);
    if (isNaN(cantidad) || cantidad <= 0) return;

    const result = await registrarDevolucion(
      parada.id,
      devProductoId,
      cantidad,
      devMotivo,
      devDetalle || undefined
    );

    if (result) {
      setDevolucionDialogOpen(false);
      resetDevolucionForm();
      loadParada(); // Recargar datos
    }
  };

  const resetCobroForm = () => {
    setCobroMonto('');
    setCobroMedioPago('efectivo');
    setCobroReferencia('');
    setCobroBanco('');
    setCobroNumeroCheque('');
  };

  const resetDevolucionForm = () => {
    setDevProductoId('');
    setDevCantidad('');
    setDevMotivo('producto_danado');
    setDevDetalle('');
  };

  const openMaps = (direccion: string) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`,
      '_blank'
    );
  };

  if (loading || !parada) {
    return (
      <ChoferLayout title="Detalle de Entrega" showNav={false}>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </ChoferLayout>
    );
  }

  const isCompleted = ['entregado', 'entrega_parcial', 'rechazado', 'no_entregado'].includes(parada.estado_entrega);
  const totalPedido = parada.pedido?.total || 0;
  const montoCobrado = parada.monto_cobrado || 0;
  const montoPendiente = totalPedido - montoCobrado;

  return (
    <ChoferLayout title="Detalle de Entrega" showNav={false}>
      <div className="p-4 space-y-4">
        {/* Header con navegación */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>

        {/* Info del cliente */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {parada.pedido?.cliente_nombre || 'Cliente'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {parada.pedido?.cliente_direccion && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{parada.pedido.cliente_direccion}</span>
              </div>
            )}
            <div className="flex gap-2 mt-3">
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
            </div>
          </CardContent>
        </Card>

        {/* Detalle del pedido */}
        {parada.pedido?.items && parada.pedido.items.length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Detalle del Pedido ({parada.pedido.items.length} productos)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {parada.pedido.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.producto_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.cantidad} x ${item.precio_unitario?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="font-semibold">
                    ${item.subtotal?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Estado de entrega */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Estado de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={parada.estado_entrega === 'entregado' ? 'default' : 'outline'}
                className={cn(
                  "h-12",
                  parada.estado_entrega === 'entregado' && 'bg-success hover:bg-success/90'
                )}
                onClick={() => handleEstadoChange('entregado')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Entregado
              </Button>
              <Button
                variant={parada.estado_entrega === 'entrega_parcial' ? 'default' : 'outline'}
                className={cn(
                  "h-12",
                  parada.estado_entrega === 'entrega_parcial' && 'bg-primary'
                )}
                onClick={() => handleEstadoChange('entrega_parcial')}
              >
                <Package className="h-4 w-4 mr-1" />
                Parcial
              </Button>
              <Button
                variant={parada.estado_entrega === 'rechazado' ? 'default' : 'outline'}
                className={cn(
                  "h-12",
                  parada.estado_entrega === 'rechazado' && 'bg-destructive'
                )}
                onClick={() => handleEstadoChange('rechazado')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rechazado
              </Button>
              <Button
                variant={parada.estado_entrega === 'no_entregado' ? 'default' : 'outline'}
                className={cn(
                  "h-12",
                  parada.estado_entrega === 'no_entregado' && 'bg-destructive'
                )}
                onClick={() => handleEstadoChange('no_entregado')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                No Entreg.
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumen monetario */}
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total del pedido:</span>
              <span className="font-semibold text-lg">
                ${totalPedido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cobrado:</span>
              <span className="font-semibold text-lg text-success">
                ${montoCobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-medium">Pendiente:</span>
              <span className={cn(
                "font-bold text-xl",
                montoPendiente > 0 ? "text-warning" : "text-success"
              )}>
                ${Math.max(0, montoPendiente).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cobros realizados */}
        {(parada.cobros?.length || 0) > 0 && (
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cobros Registrados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {parada.cobros?.map((cobro) => (
                <div key={cobro.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <div>
                    <span className="font-medium">{MEDIO_PAGO_LABELS[cobro.medio_pago]}</span>
                    {cobro.referencia && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({cobro.referencia})
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-success">
                    ${Number(cobro.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Devoluciones */}
        {(parada.devoluciones?.length || 0) > 0 && (
          <Card className="shadow-card border-destructive/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-destructive">Devoluciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {parada.devoluciones?.map((dev) => (
                <div key={dev.id} className="p-2 bg-destructive/10 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{dev.producto_nombre || dev.producto_id}</span>
                    <span className="text-destructive">x{dev.cantidad}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {MOTIVO_DEVOLUCION_LABELS[dev.motivo]}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        {['entregado', 'entrega_parcial'].includes(parada.estado_entrega) && (
          <div className="space-y-2">
            {/* Botón Cobrar */}
            <Dialog open={cobroDialogOpen} onOpenChange={setCobroDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-14 text-lg gradient-primary">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Registrar Cobro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Cobro</DialogTitle>
                  <DialogDescription>
                    Pendiente: ${Math.max(0, montoPendiente).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="monto">Monto</Label>
                    <Input
                      id="monto"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cobroMonto}
                      onChange={(e) => setCobroMonto(e.target.value)}
                    />
                    {montoPendiente > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-xs"
                        onClick={() => setCobroMonto(montoPendiente.toFixed(2))}
                      >
                        Cobrar total pendiente
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label>Medio de pago</Label>
                    <Select value={cobroMedioPago} onValueChange={(v) => setCobroMedioPago(v as MedioPago)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MEDIO_PAGO_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {cobroMedioPago === 'transferencia' && (
                    <div>
                      <Label>Referencia/Comprobante</Label>
                      <Input
                        value={cobroReferencia}
                        onChange={(e) => setCobroReferencia(e.target.value)}
                        placeholder="Número de operación"
                      />
                    </div>
                  )}
                  {cobroMedioPago === 'cheque' && (
                    <>
                      <div>
                        <Label>Número de cheque</Label>
                        <Input
                          value={cobroNumeroCheque}
                          onChange={(e) => setCobroNumeroCheque(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Banco</Label>
                        <Input
                          value={cobroBanco}
                          onChange={(e) => setCobroBanco(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleRegistrarCobro}>Registrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Botón Devolución */}
            <Dialog open={devolucionDialogOpen} onOpenChange={setDevolucionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-12 border-destructive text-destructive">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Registrar Devolución
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Devolución</DialogTitle>
                  <DialogDescription>
                    Indique el producto y motivo de la devolución
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Producto</Label>
                    <Select value={devProductoId} onValueChange={setDevProductoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {parada.pedido?.items?.map((item) => (
                          <SelectItem key={item.producto_id} value={item.producto_id}>
                            {item.producto_nombre} (x{item.cantidad})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cantidad a devolver</Label>
                    <Input
                      type="number"
                      min="1"
                      value={devCantidad}
                      onChange={(e) => setDevCantidad(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Motivo</Label>
                    <Select value={devMotivo} onValueChange={(v) => setDevMotivo(v as MotivoDevolucion)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MOTIVO_DEVOLUCION_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Detalle (opcional)</Label>
                    <Textarea
                      value={devDetalle}
                      onChange={(e) => setDevDetalle(e.target.value)}
                      placeholder="Descripción adicional..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleRegistrarDevolucion}>
                    Registrar Devolución
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </ChoferLayout>
  );
};
