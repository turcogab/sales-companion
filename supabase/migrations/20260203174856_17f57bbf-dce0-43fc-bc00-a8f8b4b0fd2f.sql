-- =============================================
-- MÓDULO DE CHOFERES/ENTREGAS
-- =============================================

-- 1. Tabla de usuarios con roles (si no existe, agregamos columna rol)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  email TEXT,
  rol TEXT NOT NULL DEFAULT 'preventista' CHECK (rol IN ('preventista', 'chofer', 'admin')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabla hoja_ruta - Rutas asignadas a choferes
CREATE TABLE public.hoja_ruta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabla hoja_ruta_paradas - Paradas/pedidos de cada ruta
CREATE TABLE public.hoja_ruta_paradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_id UUID NOT NULL REFERENCES public.hoja_ruta(id) ON DELETE CASCADE,
  pedido_id UUID NOT NULL,
  orden INTEGER NOT NULL DEFAULT 1,
  estado_entrega TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_entrega IN ('pendiente', 'en_camino', 'entregado', 'entrega_parcial', 'rechazado', 'no_entregado')),
  hora_llegada TIMESTAMP WITH TIME ZONE,
  hora_salida TIMESTAMP WITH TIME ZONE,
  firma_cliente TEXT,
  foto_entrega TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabla cobros - Pagos recibidos en cada entrega
CREATE TABLE public.cobros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_parada_id UUID NOT NULL REFERENCES public.hoja_ruta_paradas(id) ON DELETE CASCADE,
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  medio_pago TEXT NOT NULL CHECK (medio_pago IN ('efectivo', 'transferencia', 'cheque', 'tarjeta', 'credito', 'otro')),
  referencia TEXT,
  numero_cheque TEXT,
  banco TEXT,
  fecha_cheque DATE,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabla devoluciones - Productos devueltos
CREATE TABLE public.devoluciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_parada_id UUID NOT NULL REFERENCES public.hoja_ruta_paradas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  motivo TEXT NOT NULL CHECK (motivo IN ('producto_danado', 'producto_vencido', 'cliente_no_solicito', 'error_cantidad', 'cliente_rechaza', 'otro')),
  detalle_motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabla rendiciones - Cierre de ruta
CREATE TABLE public.rendiciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_id UUID NOT NULL REFERENCES public.hoja_ruta(id) ON DELETE CASCADE,
  monto_esperado DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_cobrado_efectivo DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_cobrado_otros DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_total_cobrado DECIMAL(12,2) NOT NULL DEFAULT 0,
  diferencia DECIMAL(12,2) NOT NULL DEFAULT 0,
  tipo_diferencia TEXT CHECK (tipo_diferencia IN ('sin_diferencia', 'sobrante', 'faltante')),
  observaciones TEXT,
  fecha_cierre TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_hoja_ruta_usuario ON public.hoja_ruta(usuario_id);
CREATE INDEX idx_hoja_ruta_fecha ON public.hoja_ruta(fecha);
CREATE INDEX idx_hoja_ruta_estado ON public.hoja_ruta(estado);
CREATE INDEX idx_paradas_hoja_ruta ON public.hoja_ruta_paradas(hoja_ruta_id);
CREATE INDEX idx_paradas_pedido ON public.hoja_ruta_paradas(pedido_id);
CREATE INDEX idx_cobros_parada ON public.cobros(hoja_ruta_parada_id);
CREATE INDEX idx_devoluciones_parada ON public.devoluciones(hoja_ruta_parada_id);
CREATE INDEX idx_rendiciones_hoja_ruta ON public.rendiciones(hoja_ruta_id);

-- =============================================
-- FUNCIONES HELPER PARA RLS
-- =============================================

-- Función para verificar si el usuario actual es chofer
CREATE OR REPLACE FUNCTION public.is_chofer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE user_id = auth.uid() 
    AND rol = 'chofer'
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función para obtener el id del usuario actual en la tabla usuarios
CREATE OR REPLACE FUNCTION public.get_usuario_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM public.usuarios 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función para verificar si el usuario es dueño de una ruta
CREATE OR REPLACE FUNCTION public.is_route_owner(route_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.hoja_ruta hr
    JOIN public.usuarios u ON hr.usuario_id = u.id
    WHERE hr.id = route_id 
    AND u.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función para verificar si el usuario es dueño de una parada
CREATE OR REPLACE FUNCTION public.is_stop_owner(stop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.hoja_ruta_paradas p
    JOIN public.hoja_ruta hr ON p.hoja_ruta_id = hr.id
    JOIN public.usuarios u ON hr.usuario_id = u.id
    WHERE p.id = stop_id 
    AND u.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoja_ruta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoja_ruta_paradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendiciones ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS
-- =============================================

-- USUARIOS: Los usuarios pueden ver su propio registro
CREATE POLICY "Usuarios pueden ver su propio perfil"
ON public.usuarios FOR SELECT
USING (user_id = auth.uid());

-- HOJA_RUTA: Choferes pueden ver sus rutas asignadas
CREATE POLICY "Choferes ven sus rutas"
ON public.hoja_ruta FOR SELECT
USING (
  usuario_id = public.get_usuario_id()
);

CREATE POLICY "Choferes actualizan sus rutas"
ON public.hoja_ruta FOR UPDATE
USING (
  usuario_id = public.get_usuario_id()
);

-- HOJA_RUTA_PARADAS: Choferes pueden ver y actualizar paradas de sus rutas
CREATE POLICY "Choferes ven paradas de sus rutas"
ON public.hoja_ruta_paradas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hoja_ruta hr
    WHERE hr.id = hoja_ruta_id
    AND hr.usuario_id = public.get_usuario_id()
  )
);

CREATE POLICY "Choferes actualizan paradas de sus rutas"
ON public.hoja_ruta_paradas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.hoja_ruta hr
    WHERE hr.id = hoja_ruta_id
    AND hr.usuario_id = public.get_usuario_id()
  )
);

-- COBROS: Choferes pueden ver y crear cobros de sus entregas
CREATE POLICY "Choferes ven cobros de sus entregas"
ON public.cobros FOR SELECT
USING (
  public.is_stop_owner(hoja_ruta_parada_id)
);

CREATE POLICY "Choferes registran cobros"
ON public.cobros FOR INSERT
WITH CHECK (
  public.is_stop_owner(hoja_ruta_parada_id)
);

-- DEVOLUCIONES: Choferes pueden ver y crear devoluciones
CREATE POLICY "Choferes ven devoluciones de sus entregas"
ON public.devoluciones FOR SELECT
USING (
  public.is_stop_owner(hoja_ruta_parada_id)
);

CREATE POLICY "Choferes registran devoluciones"
ON public.devoluciones FOR INSERT
WITH CHECK (
  public.is_stop_owner(hoja_ruta_parada_id)
);

-- RENDICIONES: Choferes pueden ver y crear rendiciones de sus rutas
CREATE POLICY "Choferes ven rendiciones de sus rutas"
ON public.rendiciones FOR SELECT
USING (
  public.is_route_owner(hoja_ruta_id)
);

CREATE POLICY "Choferes crean rendiciones"
ON public.rendiciones FOR INSERT
WITH CHECK (
  public.is_route_owner(hoja_ruta_id)
);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hoja_ruta_updated_at
BEFORE UPDATE ON public.hoja_ruta
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hoja_ruta_paradas_updated_at
BEFORE UPDATE ON public.hoja_ruta_paradas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();