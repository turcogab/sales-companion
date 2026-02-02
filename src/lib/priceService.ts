import { getAll, Producto } from './db';

export interface ListaPrecioPorcentaje {
  id: string;
  lista_precio_id: string;
  marca_id: string | null;
  tipo_producto_id: string | null;
  porcentaje: number;
}

export interface ProductoConPrecio extends Producto {
  precio_costo: number;
  marca_id: string | null;
  tipo_producto_id: string | null;
  precio_calculado: number;
}

// Calcular el precio de venta basado en la lógica de lista de precios
export const calcularPrecio = (
  precioCosto: number,
  marcaId: string | null,
  tipoProductoId: string | null,
  porcentajes: ListaPrecioPorcentaje[]
): number => {
  if (!precioCosto || precioCosto <= 0) return 0;

  // 1. Buscar por marca_id primero
  if (marcaId) {
    const porcentajeMarca = porcentajes.find(p => p.marca_id === marcaId);
    if (porcentajeMarca) {
      return precioCosto * (1 + porcentajeMarca.porcentaje / 100);
    }
  }

  // 2. Si no hay marca o no se encontró, buscar por tipo_producto_id
  if (tipoProductoId) {
    const porcentajeTipo = porcentajes.find(p => p.tipo_producto_id === tipoProductoId);
    if (porcentajeTipo) {
      return precioCosto * (1 + porcentajeTipo.porcentaje / 100);
    }
  }

  // 3. Si no hay coincidencias, devolver el precio de costo
  return precioCosto;
};

// Obtener productos con precios calculados
export const getProductosConPrecios = async (): Promise<ProductoConPrecio[]> => {
  const [productos, porcentajes] = await Promise.all([
    getAll<Producto>('productos'),
    getAll<ListaPrecioPorcentaje>('lista_precio_porcentajes'),
  ]);

  return productos.map(producto => {
    const productoExtendido = producto as ProductoConPrecio;
    const precioCalculado = calcularPrecio(
      productoExtendido.precio_costo || productoExtendido.precio,
      productoExtendido.marca_id || null,
      productoExtendido.tipo_producto_id || null,
      porcentajes
    );

    return {
      ...productoExtendido,
      precio_calculado: precioCalculado,
      precio: precioCalculado, // Sobreescribir precio para compatibilidad
    };
  });
};
