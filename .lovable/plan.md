
# Plan: Conectar Módulo de Chofer al Sistema Externo

## Resumen
El módulo de chofer actualmente está conectado a una base de datos diferente a la del sistema principal. Este plan corrige la conexión para que utilice la misma base de datos externa donde ya están los clientes, productos y pedidos.

## Diagnóstico
- **Sistema principal**: Usa la base de datos externa (zipqraqiztulxyuzhtjo) para autenticación, clientes, productos, pedidos
- **Módulo chofer**: Actualmente conecta a Lovable Cloud (jyzfvpeunxgikyeiegxp)
- **Problema**: El chofer no puede ver los datos reales porque está consultando una base diferente

## Cambios a Realizar

### 1. Actualizar hook useChoferData
Cambiar la importación del cliente de Supabase para usar la base externa:
- **Archivo**: `src/hooks/useChoferData.ts`
- **Cambio**: Importar desde `@/lib/supabase` en lugar de `@/integrations/supabase/client`

### 2. Requisito Previo (Acción del Usuario)
Las tablas del módulo chofer deben existir en la base de datos externa. El usuario debe ejecutar el siguiente SQL en su proyecto de Supabase externo:

```text
-- Tabla de usuarios con roles (si no existe)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  email TEXT,
  rol TEXT NOT NULL DEFAULT 'preventista' CHECK (rol IN ('preventista', 'chofer', 'admin')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hoja de ruta diaria
CREATE TABLE IF NOT EXISTS public.hoja_ruta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Paradas de la ruta (pedidos a entregar)
CREATE TABLE IF NOT EXISTS public.hoja_ruta_paradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_id UUID NOT NULL REFERENCES public.hoja_ruta(id),
  pedido_id UUID NOT NULL,
  orden INTEGER NOT NULL DEFAULT 1,
  estado_entrega TEXT NOT NULL DEFAULT 'pendiente',
  hora_llegada TIMESTAMPTZ,
  hora_salida TIMESTAMPTZ,
  firma_cliente TEXT,
  foto_entrega TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cobros realizados
CREATE TABLE IF NOT EXISTS public.cobros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_parada_id UUID NOT NULL REFERENCES public.hoja_ruta_paradas(id),
  monto NUMERIC NOT NULL,
  medio_pago TEXT NOT NULL,
  referencia TEXT,
  numero_cheque TEXT,
  banco TEXT,
  fecha_cheque DATE,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Devoluciones
CREATE TABLE IF NOT EXISTS public.devoluciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_parada_id UUID NOT NULL REFERENCES public.hoja_ruta_paradas(id),
  producto_id UUID NOT NULL,
  cantidad INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  detalle_motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rendiciones
CREATE TABLE IF NOT EXISTS public.rendiciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hoja_ruta_id UUID NOT NULL REFERENCES public.hoja_ruta(id),
  monto_esperado NUMERIC NOT NULL DEFAULT 0,
  monto_cobrado_efectivo NUMERIC NOT NULL DEFAULT 0,
  monto_cobrado_otros NUMERIC NOT NULL DEFAULT 0,
  monto_total_cobrado NUMERIC NOT NULL DEFAULT 0,
  diferencia NUMERIC NOT NULL DEFAULT 0,
  tipo_diferencia TEXT,
  observaciones TEXT,
  fecha_cierre TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Funciones de seguridad
CREATE OR REPLACE FUNCTION public.get_usuario_id()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_route_owner(route_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.hoja_ruta hr
    JOIN public.usuarios u ON hr.usuario_id = u.id
    WHERE hr.id = route_id AND u.user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_stop_owner(stop_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.hoja_ruta_paradas p
    JOIN public.hoja_ruta hr ON p.hoja_ruta_id = hr.id
    JOIN public.usuarios u ON hr.usuario_id = u.id
    WHERE p.id = stop_id AND u.user_id = auth.uid()
  );
END;
$$;

-- Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoja_ruta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoja_ruta_paradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendiciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios ven su perfil" ON public.usuarios FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Choferes ven sus rutas" ON public.hoja_ruta FOR SELECT USING (usuario_id = get_usuario_id());
CREATE POLICY "Choferes actualizan sus rutas" ON public.hoja_ruta FOR UPDATE USING (usuario_id = get_usuario_id());
CREATE POLICY "Choferes ven paradas de sus rutas" ON public.hoja_ruta_paradas FOR SELECT 
  USING (EXISTS (SELECT 1 FROM hoja_ruta hr WHERE hr.id = hoja_ruta_id AND hr.usuario_id = get_usuario_id()));
CREATE POLICY "Choferes actualizan paradas" ON public.hoja_ruta_paradas FOR UPDATE
  USING (EXISTS (SELECT 1 FROM hoja_ruta hr WHERE hr.id = hoja_ruta_id AND hr.usuario_id = get_usuario_id()));
CREATE POLICY "Choferes registran cobros" ON public.cobros FOR INSERT WITH CHECK (is_stop_owner(hoja_ruta_parada_id));
CREATE POLICY "Choferes ven cobros" ON public.cobros FOR SELECT USING (is_stop_owner(hoja_ruta_parada_id));
CREATE POLICY "Choferes registran devoluciones" ON public.devoluciones FOR INSERT WITH CHECK (is_stop_owner(hoja_ruta_parada_id));
CREATE POLICY "Choferes ven devoluciones" ON public.devoluciones FOR SELECT USING (is_stop_owner(hoja_ruta_parada_id));
CREATE POLICY "Choferes crean rendiciones" ON public.rendiciones FOR INSERT WITH CHECK (is_route_owner(hoja_ruta_id));
CREATE POLICY "Choferes ven rendiciones" ON public.rendiciones FOR SELECT USING (is_route_owner(hoja_ruta_id));
```

## Flujo de Implementación

1. **Usuario ejecuta el SQL** en su Supabase externo (Dashboard → SQL Editor)
2. **Se actualiza el código** para usar la conexión correcta
3. **Se crea un registro en `usuarios`** asociando el auth.user con rol 'chofer'
4. **Se crean datos de prueba** en hoja_ruta y hoja_ruta_paradas

## Archivos Afectados
| Archivo | Cambio |
|---------|--------|
| `src/hooks/useChoferData.ts` | Cambiar import de Supabase |

---

## Sección Técnica

### Diferencia de Conexiones

```text
ACTUAL (incorrecto):
useChoferData.ts → @/integrations/supabase/client → jyzfvpeunxgikyeiegxp (Lovable Cloud)

CORRECTO:
useChoferData.ts → @/lib/supabase → zipqraqiztulxyuzhtjo (Base Externa)
```

### Cambio en useChoferData.ts

```typescript
// ANTES
import { supabase } from '@/integrations/supabase/client';

// DESPUÉS
import { supabase } from '@/lib/supabase';
```

Este cambio mínimo asegura que todas las operaciones del módulo chofer (consultar rutas, registrar cobros, devoluciones, rendiciones) se realicen contra la misma base de datos donde están los pedidos y clientes reales.
