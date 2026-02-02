
# Plan: Detalle de Pedido y Sincronizacion

## Resumen del Problema

He identificado dos problemas principales:

1. **Falta la pagina de detalle del pedido**: Cuando tocas un pedido de la lista, navegas a `/pedidos/:id` pero esa ruta no existe - por eso ves una pagina en blanco o NotFound.

2. **El pedido no se sincroniza**: El mensaje "1 elemento por sincronizar" aparece porque el pedido se guardo correctamente en tu dispositivo (offline), pero fallo al intentar subirlo a la base de datos remota. El error especifico es: *"new row violates row-level security policy for table pedidos"* - esto significa que la base de datos externa tiene reglas de seguridad que bloquean la insercion.

## Plan de Implementacion

### Paso 1: Crear la Pagina de Detalle del Pedido

Crear `src/pages/DetallePedidoPage.tsx` que mostrara:

- Informacion del cliente (nombre, codigo)
- Estado del pedido con indicador visual (pendiente/sincronizado)
- Lista de productos con cantidades y precios
- Total del pedido
- Notas si las hay
- Fecha de creacion
- Botones de accion (volver, editar, eliminar)

### Paso 2: Agregar la Ruta

Actualizar `src/App.tsx` para incluir:
```
/pedidos/:id -> DetallePedidoPage
```

### Paso 3: Mejorar el Manejo de Errores de Sincronizacion

Modificar `src/lib/syncService.ts` para:
- Capturar errores especificos de RLS (401/403)
- Mostrar mensajes claros al usuario cuando la sincronizacion falle
- Permitir reintentar la sincronizacion manualmente

### Paso 4: Agregar Indicador de Estado en Detalle

En la pagina de detalle mostrar claramente:
- Si el pedido esta pendiente de sincronizar (icono de alerta)
- Boton para reintentar sincronizacion manualmente
- Opcion de eliminar pedidos que no se pueden sincronizar

## Flujo de Usuario Propuesto

```text
+------------------+     +------------------+     +------------------+
|  Lista Pedidos   | --> | Detalle Pedido   | --> |    Acciones      |
|                  |     |                  |     |                  |
| - Ver todos      |     | - Info cliente   |     | - Reintentar     |
| - Estado visible |     | - Productos      |     |   sincronizar    |
| - Tocar para ver |     | - Total          |     | - Eliminar       |
+------------------+     | - Estado sync    |     | - Volver         |
                         +------------------+     +------------------+
```

## Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `src/pages/DetallePedidoPage.tsx` | Crear |
| `src/App.tsx` | Agregar ruta |
| `src/lib/syncService.ts` | Mejorar manejo de errores |

## Seccion Tecnica

### Estructura de DetallePedidoPage

```typescript
// Obtener ID de la URL
const { id } = useParams();

// Cargar pedido de IndexedDB
const [pedido, setPedido] = useState<Pedido | null>(null);
useEffect(() => {
  getById<Pedido>('pedidos', id).then(setPedido);
}, [id]);

// Funcion para reintentar sync individual
const handleRetrySync = async () => {
  // Intentar subir solo este pedido
};
```

### Problema de RLS (Seguridad)

El error 401 indica que la base de datos Supabase externa tiene Row Level Security habilitado y no permite inserciones anonimas. Para resolverlo habria que:

1. Revisar las politicas RLS de la tabla `pedidos` en Supabase
2. O agregar autenticacion de usuario en la app
3. O crear una politica que permita inserciones (menos seguro)

Por ahora, el plan se enfoca en mostrar el estado correctamente y dar opciones al usuario.
