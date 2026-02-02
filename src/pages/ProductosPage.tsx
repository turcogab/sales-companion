import { useState, useEffect } from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { getAll, Producto } from '@/lib/db';
import { cn } from '@/lib/utils';

export const ProductosPage = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoriaFilter, setCategoriaFilter] = useState<string | null>(null);

  useEffect(() => {
    const loadProductos = async () => {
      try {
        const data = await getAll<Producto>('productos');
        setProductos(data);
      } catch (error) {
        console.error('Error loading productos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProductos();
  }, []);

  const categorias = [...new Set(productos.map((p) => p.categoria))];

  const filteredProductos = productos.filter((producto) => {
    const matchesSearch =
      producto.nombre.toLowerCase().includes(search.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(search.toLowerCase());
    const matchesCategoria = !categoriaFilter || producto.categoria === categoriaFilter;
    return matchesSearch && matchesCategoria;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <MobileLayout title="Productos">
      <div className="p-4 space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o código..."
        />

        {/* Filtro de categorías */}
        {categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => setCategoriaFilter(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                !categoriaFilter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  categoriaFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredProductos.length === 0 ? (
          <EmptyState
            icon={Package}
            title={search || categoriaFilter ? 'Sin resultados' : 'Sin productos'}
            description={
              search || categoriaFilter
                ? 'No se encontraron productos con ese criterio'
                : 'Sincroniza para cargar los productos'
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProductos.map((producto) => (
              <Card
                key={producto.id}
                className={cn(
                  "shadow-card overflow-hidden",
                  producto.stock <= 0 && "opacity-60"
                )}
              >
                <CardContent className="p-3">
                  <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                    {producto.imagen_url ? (
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-10 w-10 text-muted-foreground/50" />
                    )}
                    {producto.stock <= 5 && producto.stock > 0 && (
                      <div className="absolute top-1 right-1 bg-warning text-warning-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                        Bajo stock
                      </div>
                    )}
                    {producto.stock <= 0 && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="flex items-center gap-1 text-destructive text-sm font-medium">
                          <AlertTriangle className="h-4 w-4" />
                          Sin stock
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{producto.codigo}</p>
                  <h3 className="font-medium text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
                    {producto.nombre}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-base font-bold text-primary">
                      {formatCurrency(producto.precio)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {producto.stock}
                    </p>
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
