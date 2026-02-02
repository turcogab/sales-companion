import { supabase } from './supabase';
import { 
  getAll, 
  put, 
  clearStore, 
  setLastSync, 
  getByIndex,
  Cliente, 
  Producto, 
  Pedido, 
  Cobranza 
} from './db';

export interface SyncResult {
  success: boolean;
  downloaded: {
    clientes: number;
    productos: number;
  };
  uploaded: {
    pedidos: number;
    cobranzas: number;
  };
  errors: string[];
}

// Descargar clientes desde Supabase
export const syncClientes = async (): Promise<{ count: number; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*');

    if (error) throw error;

    if (data) {
      // Limpiar store local y guardar nuevos datos
      await clearStore('clientes');
      
      for (const cliente of data) {
        await put<Cliente>('clientes', {
          id: cliente.id,
          codigo: cliente.codigo || '',
          nombre: cliente.nombre || cliente.razon_social || '',
          direccion: cliente.direccion || '',
          telefono: cliente.telefono || '',
          email: cliente.email || '',
          limite_credito: cliente.limite_credito || 0,
          saldo: cliente.saldo || 0,
          condicion_fiscal: cliente.condicion_fiscal || '',
          lista_precios: cliente.lista_precios || 'general',
          latitud: cliente.latitud,
          longitud: cliente.longitud,
          orden_ruta: cliente.orden_ruta,
          sincronizado: true,
          updated_at: cliente.updated_at || new Date().toISOString(),
        });
      }
      
      return { count: data.length };
    }
    
    return { count: 0 };
  } catch (error: any) {
    console.error('Error syncing clientes:', error);
    return { count: 0, error: error.message };
  }
};

// Descargar productos desde Supabase
export const syncProductos = async (): Promise<{ count: number; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*');

    if (error) throw error;

    if (data) {
      await clearStore('productos');
      
      for (const producto of data) {
        await put<Producto>('productos', {
          id: producto.id,
          codigo: producto.codigo || '',
          nombre: producto.nombre || producto.descripcion || '',
          descripcion: producto.descripcion || '',
          precio: producto.precio || producto.precio_venta || 0,
          stock: producto.stock || producto.stock_actual || 0,
          categoria: producto.categoria || 'General',
          imagen_url: producto.imagen_url,
          sincronizado: true,
          updated_at: producto.updated_at || new Date().toISOString(),
        });
      }
      
      return { count: data.length };
    }
    
    return { count: 0 };
  } catch (error: any) {
    console.error('Error syncing productos:', error);
    return { count: 0, error: error.message };
  }
};

// Subir pedidos pendientes a Supabase
export const uploadPedidos = async (): Promise<{ count: number; error?: string }> => {
  try {
    const allPedidos = await getAll<Pedido>('pedidos');
    const pedidosPendientes = allPedidos.filter(p => !p.sincronizado);
    
    let uploaded = 0;
    
    for (const pedido of pedidosPendientes) {
      // Insertar el pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          id: pedido.id,
          cliente_id: pedido.cliente_id,
          total: pedido.total,
          estado: pedido.estado,
          notas: pedido.notas,
          created_at: pedido.created_at,
        })
        .select()
        .single();

      if (pedidoError) {
        console.error('Error uploading pedido:', pedidoError);
        continue;
      }

      // Insertar los items del pedido
      const itemsToInsert = pedido.items.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('pedido_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error uploading pedido items:', itemsError);
      }

      // Marcar como sincronizado localmente
      await put<Pedido>('pedidos', {
        ...pedido,
        sincronizado: true,
        estado: 'sincronizado',
      });
      
      uploaded++;
    }
    
    return { count: uploaded };
  } catch (error: any) {
    console.error('Error uploading pedidos:', error);
    return { count: 0, error: error.message };
  }
};

// Subir cobranzas pendientes a Supabase
export const uploadCobranzas = async (): Promise<{ count: number; error?: string }> => {
  try {
    const allCobranzas = await getAll<Cobranza>('cobranzas');
    const cobranzasPendientes = allCobranzas.filter(c => !c.sincronizado);
    
    let uploaded = 0;
    
    for (const cobranza of cobranzasPendientes) {
      const { error } = await supabase
        .from('cobranzas')
        .insert({
          id: cobranza.id,
          cliente_id: cobranza.cliente_id,
          monto: cobranza.monto,
          tipo_pago: cobranza.tipo_pago,
          referencia: cobranza.referencia,
          notas: cobranza.notas,
          created_at: cobranza.created_at,
        });

      if (error) {
        console.error('Error uploading cobranza:', error);
        continue;
      }

      // Marcar como sincronizado localmente
      await put<Cobranza>('cobranzas', {
        ...cobranza,
        sincronizado: true,
      });
      
      uploaded++;
    }
    
    return { count: uploaded };
  } catch (error: any) {
    console.error('Error uploading cobranzas:', error);
    return { count: 0, error: error.message };
  }
};

// Sincronización completa
export const fullSync = async (): Promise<SyncResult> => {
  const result: SyncResult = {
    success: true,
    downloaded: { clientes: 0, productos: 0 },
    uploaded: { pedidos: 0, cobranzas: 0 },
    errors: [],
  };

  // 1. Subir datos pendientes primero
  const pedidosResult = await uploadPedidos();
  result.uploaded.pedidos = pedidosResult.count;
  if (pedidosResult.error) {
    result.errors.push(`Pedidos: ${pedidosResult.error}`);
  }

  const cobranzasResult = await uploadCobranzas();
  result.uploaded.cobranzas = cobranzasResult.count;
  if (cobranzasResult.error) {
    result.errors.push(`Cobranzas: ${cobranzasResult.error}`);
  }

  // 2. Descargar datos actualizados
  const clientesResult = await syncClientes();
  result.downloaded.clientes = clientesResult.count;
  if (clientesResult.error) {
    result.errors.push(`Clientes: ${clientesResult.error}`);
  }

  const productosResult = await syncProductos();
  result.downloaded.productos = productosResult.count;
  if (productosResult.error) {
    result.errors.push(`Productos: ${productosResult.error}`);
  }

  // Actualizar timestamp de última sincronización
  if (result.errors.length === 0) {
    await setLastSync();
  } else {
    result.success = false;
  }

  return result;
};

// Verificar conexión con Supabase
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('clientes').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};
