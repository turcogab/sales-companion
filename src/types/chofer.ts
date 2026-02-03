// Tipos para el módulo de choferes/entregas

export interface Usuario {
  id: string;
  user_id: string;
  nombre: string;
  email: string | null;
  rol: 'preventista' | 'chofer' | 'admin';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface HojaRuta {
  id: string;
  usuario_id: string;
  fecha: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones cargadas
  paradas?: HojaRutaParada[];
  total_paradas?: number;
  paradas_completadas?: number;
}

export interface HojaRutaParada {
  id: string;
  hoja_ruta_id: string;
  pedido_id: string;
  orden: number;
  estado_entrega: EstadoEntrega;
  hora_llegada: string | null;
  hora_salida: string | null;
  firma_cliente: string | null;
  foto_entrega: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Datos del pedido (cargados por join)
  pedido?: {
    id: string;
    cliente_nombre: string;
    cliente_direccion?: string;
    cliente_telefono?: string;
    total: number;
    items: PedidoItem[];
  };
  // Cobros y devoluciones asociados
  cobros?: Cobro[];
  devoluciones?: Devolucion[];
  monto_cobrado?: number;
  monto_pendiente?: number;
}

export type EstadoEntrega = 
  | 'pendiente' 
  | 'en_camino' 
  | 'entregado' 
  | 'entrega_parcial' 
  | 'rechazado' 
  | 'no_entregado';

export interface PedidoItem {
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Cobro {
  id: string;
  hoja_ruta_parada_id: string;
  monto: number;
  medio_pago: MedioPago;
  referencia: string | null;
  numero_cheque: string | null;
  banco: string | null;
  fecha_cheque: string | null;
  observaciones: string | null;
  created_at: string;
}

export type MedioPago = 
  | 'efectivo' 
  | 'transferencia' 
  | 'cheque' 
  | 'tarjeta' 
  | 'credito' 
  | 'otro';

export interface Devolucion {
  id: string;
  hoja_ruta_parada_id: string;
  producto_id: string;
  cantidad: number;
  motivo: MotivoDevolucion;
  detalle_motivo: string | null;
  created_at: string;
  // Datos del producto
  producto_nombre?: string;
}

export type MotivoDevolucion = 
  | 'producto_danado' 
  | 'producto_vencido' 
  | 'cliente_no_solicito' 
  | 'error_cantidad' 
  | 'cliente_rechaza' 
  | 'otro';

export interface Rendicion {
  id: string;
  hoja_ruta_id: string;
  monto_esperado: number;
  monto_cobrado_efectivo: number;
  monto_cobrado_otros: number;
  monto_total_cobrado: number;
  diferencia: number;
  tipo_diferencia: 'sin_diferencia' | 'sobrante' | 'faltante' | null;
  observaciones: string | null;
  fecha_cierre: string;
  created_at: string;
}

// Labels para UI
export const ESTADO_ENTREGA_LABELS: Record<EstadoEntrega, string> = {
  pendiente: 'Pendiente',
  en_camino: 'En camino',
  entregado: 'Entregado',
  entrega_parcial: 'Entrega parcial',
  rechazado: 'Rechazado',
  no_entregado: 'No entregado',
};

export const MEDIO_PAGO_LABELS: Record<MedioPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  tarjeta: 'Tarjeta',
  credito: 'Crédito',
  otro: 'Otro',
};

export const MOTIVO_DEVOLUCION_LABELS: Record<MotivoDevolucion, string> = {
  producto_danado: 'Producto dañado',
  producto_vencido: 'Producto vencido',
  cliente_no_solicito: 'Cliente no lo solicitó',
  error_cantidad: 'Error en cantidad',
  cliente_rechaza: 'Cliente rechaza',
  otro: 'Otro motivo',
};
