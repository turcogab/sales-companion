import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Minus, ShoppingCart, Check, User } from 'lucide-react';
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
import { getAll, put, generateId, Cliente, Pedido, ItemPedido, ListaPrecioPorcentaje } from '@/lib/db';
import { getProductosConPrecios, ProductoConPrecio } from '@/lib/priceService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CartItem extends ItemPedido {
  stock: number;
}

export const NuevoPedidoPage = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<ProductoConPrecio[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [searchProducto, setSearchProducto] = useState('');
  const [notas, setNotas] = useState('');
  const [clienteSheetOpen, setClienteSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [clientesData, productosData] = await Promise.all([
        getAll<Cliente>('clientes'),
        getProductosConPrecios(),
      ]);
      setClientes(clientesData);
      setProductos(productosData);
    };
    loadData();
  }, []);

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.codigo.toLowerCase().includes(searchCliente.toLowerCase())
  );

  const filteredProductos = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchProducto.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchProducto.toLowerCase())
  );

  const addToCart = (producto: ProductoConPrecio) => {
    const existingItem = cart.find((item) => item.producto_id === producto.id);
    const precioFinal = producto.precio_calculado || producto.precio;
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.producto_id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precio_unitario,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          cantidad: 1,
          precio_unitario: precioFinal,
          subtotal: precioFinal,
          stock: producto.stock,
        },
      ]);
    }
  };

  const updateQuantity = (productoId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.producto_id === productoId) {
            const newQty = item.cantidad + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              cantidad: newQty,
              subtotal: newQty * item.precio_unitario,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

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
    if (cart.length === 0) {
      toast.error('Agrega productos al pedido');
      return;
    }

    setSaving(true);
    try {
      const pedido: Pedido = {
        id: generateId(),
        cliente_id: selectedCliente.id,
        cliente_nombre: selectedCliente.nombre,
        items: cart.map(({ stock, ...item }) => item),
        total,
        estado: 'pendiente',
        notas: notas || undefined,
        created_at: new Date().toISOString(),
        sincronizado: false,
      };

      await put('pedidos', pedido);
      toast.success('Pedido guardado');
      navigate('/pedidos');
    } catch (error) {
      console.error('Error saving pedido:', error);
      toast.error('Error al guardar el pedido');
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
          <h1 className="text-lg font-semibold">Nuevo Pedido</h1>
        </div>
      </header>

      <main className="flex-1 pb-32 overflow-auto">
        <div className="p-4 space-y-4">
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
                          <p className="text-sm text-muted-foreground">{selectedCliente.codigo}</p>
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
                      <p className="font-medium">{cliente.nombre}</p>
                      <p className="text-sm text-muted-foreground">{cliente.codigo} • {cliente.direccion}</p>
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Búsqueda de productos */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchProducto}
              onChange={(e) => setSearchProducto(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Lista de productos */}
          {searchProducto && (
            <div className="space-y-2">
              {filteredProductos.slice(0, 5).map((producto) => {
                const inCart = cart.find((item) => item.producto_id === producto.id);
                return (
                  <Card
                    key={producto.id}
                    className="shadow-card"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{producto.codigo}</p>
                          <p className="font-medium text-foreground truncate">{producto.nombre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-semibold text-primary">
                              {formatCurrency(producto.precio)}
                            </p>
                            <span className={cn(
                              "text-xs",
                              producto.stock <= 0 ? "text-destructive" : "text-muted-foreground"
                            )}>
                              Stock: {producto.stock}
                            </span>
                          </div>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(producto.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{inCart.cantidad}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(producto.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addToCart(producto)}
                            className="gradient-primary"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Carrito */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Productos en el pedido ({cart.length})
              </h3>
              {cart.map((item) => (
                <Card key={item.producto_id} className="shadow-card">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.producto_nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.precio_unitario)} x {item.cantidad}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.producto_id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.cantidad}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.producto_id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <p className="w-20 text-right font-semibold text-primary">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">{cart.length} productos</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(total)}</p>
          </div>
        </div>
        <Button
          className="w-full gradient-primary h-12 text-base"
          disabled={!selectedCliente || cart.length === 0 || saving}
          onClick={handleSave}
        >
          {saving ? 'Guardando...' : 'Guardar Pedido'}
        </Button>
      </div>
    </div>
  );
};
