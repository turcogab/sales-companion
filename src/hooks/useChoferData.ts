import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  HojaRuta, 
  HojaRutaParada, 
  Cobro, 
  Devolucion,
  Rendicion,
  MedioPago,
  MotivoDevolucion,
  EstadoEntrega
} from '@/types/chofer';
import { toast } from 'sonner';

export const useChoferData = () => {
  const [hojaRuta, setHojaRuta] = useState<HojaRuta | null>(null);
  const [paradas, setParadas] = useState<HojaRutaParada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar la hoja de ruta del día
  const loadHojaRutaDelDia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const hoy = new Date().toISOString().split('T')[0];

      // Obtener hoja de ruta del día
      const { data: hojaData, error: hojaError } = await supabase
        .from('hoja_ruta')
        .select('*')
        .eq('fecha', hoy)
        .in('estado', ['pendiente', 'en_progreso'])
        .maybeSingle();

      if (hojaError) throw hojaError;

      if (!hojaData) {
        setHojaRuta(null);
        setParadas([]);
        return;
      }

      setHojaRuta(hojaData as HojaRuta);

      // Cargar paradas con sus cobros y devoluciones
      const { data: paradasData, error: paradasError } = await supabase
        .from('hoja_ruta_paradas')
        .select(`
          *,
          cobros(*),
          devoluciones(*)
        `)
        .eq('hoja_ruta_id', hojaData.id)
        .order('orden', { ascending: true });

      if (paradasError) throw paradasError;

      // Procesar paradas para calcular montos
      const paradasProcesadas = (paradasData || []).map((parada: any) => {
        const cobros = parada.cobros || [];
        const monto_cobrado = cobros.reduce((sum: number, c: Cobro) => sum + Number(c.monto), 0);
        
        return {
          ...parada,
          monto_cobrado,
          // El monto pendiente se calculará cuando tengamos el total del pedido
        } as HojaRutaParada;
      });

      setParadas(paradasProcesadas);
    } catch (err) {
      console.error('Error loading hoja de ruta:', err);
      setError('Error al cargar la ruta del día');
    } finally {
      setLoading(false);
    }
  }, []);

  // Iniciar ruta (cambiar estado a en_progreso)
  const iniciarRuta = async () => {
    if (!hojaRuta) return false;
    
    try {
      const { error } = await supabase
        .from('hoja_ruta')
        .update({ estado: 'en_progreso' })
        .eq('id', hojaRuta.id);

      if (error) throw error;

      setHojaRuta({ ...hojaRuta, estado: 'en_progreso' });
      toast.success('Ruta iniciada');
      return true;
    } catch (err) {
      console.error('Error iniciando ruta:', err);
      toast.error('Error al iniciar la ruta');
      return false;
    }
  };

  // Actualizar estado de entrega
  const actualizarEstadoEntrega = async (
    paradaId: string, 
    nuevoEstado: EstadoEntrega,
    observaciones?: string
  ) => {
    try {
      const updateData: Partial<HojaRutaParada> = {
        estado_entrega: nuevoEstado,
        observaciones,
      };

      // Registrar hora de llegada si es el primer cambio de estado
      const parada = paradas.find(p => p.id === paradaId);
      if (parada && !parada.hora_llegada && nuevoEstado !== 'pendiente') {
        updateData.hora_llegada = new Date().toISOString();
      }

      // Registrar hora de salida si se marca como completado
      if (['entregado', 'entrega_parcial', 'rechazado', 'no_entregado'].includes(nuevoEstado)) {
        updateData.hora_salida = new Date().toISOString();
      }

      const { error } = await supabase
        .from('hoja_ruta_paradas')
        .update(updateData)
        .eq('id', paradaId);

      if (error) throw error;

      // Actualizar estado local
      setParadas(prev => prev.map(p => 
        p.id === paradaId 
          ? { ...p, ...updateData }
          : p
      ));

      toast.success('Estado actualizado');
      return true;
    } catch (err) {
      console.error('Error actualizando estado:', err);
      toast.error('Error al actualizar el estado');
      return false;
    }
  };

  // Registrar cobro
  const registrarCobro = async (
    paradaId: string,
    monto: number,
    medioPago: MedioPago,
    datos?: {
      referencia?: string;
      numero_cheque?: string;
      banco?: string;
      fecha_cheque?: string;
      observaciones?: string;
    }
  ) => {
    try {
      const { data, error } = await supabase
        .from('cobros')
        .insert({
          hoja_ruta_parada_id: paradaId,
          monto,
          medio_pago: medioPago,
          ...datos,
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setParadas(prev => prev.map(p => {
        if (p.id === paradaId) {
          const nuevoCobros = [...(p.cobros || []), data as Cobro];
          const nuevoMontoCobrado = nuevoCobros.reduce((sum, c) => sum + Number(c.monto), 0);
          return {
            ...p,
            cobros: nuevoCobros,
            monto_cobrado: nuevoMontoCobrado,
          };
        }
        return p;
      }));

      toast.success('Cobro registrado');
      return data as Cobro;
    } catch (err) {
      console.error('Error registrando cobro:', err);
      toast.error('Error al registrar el cobro');
      return null;
    }
  };

  // Registrar devolución
  const registrarDevolucion = async (
    paradaId: string,
    productoId: string,
    cantidad: number,
    motivo: MotivoDevolucion,
    detalleMotivo?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('devoluciones')
        .insert({
          hoja_ruta_parada_id: paradaId,
          producto_id: productoId,
          cantidad,
          motivo,
          detalle_motivo: detalleMotivo,
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setParadas(prev => prev.map(p => {
        if (p.id === paradaId) {
          return {
            ...p,
            devoluciones: [...(p.devoluciones || []), data as Devolucion],
          };
        }
        return p;
      }));

      toast.success('Devolución registrada');
      return data as Devolucion;
    } catch (err) {
      console.error('Error registrando devolución:', err);
      toast.error('Error al registrar la devolución');
      return null;
    }
  };

  // Finalizar ruta y crear rendición
  const finalizarRuta = async (
    montoEfectivoReal: number,
    observaciones?: string
  ) => {
    if (!hojaRuta) return null;

    try {
      // Calcular totales
      let montoEsperado = 0;
      let montoEfectivoRegistrado = 0;
      let montoOtros = 0;

      paradas.forEach(parada => {
        // Sumar total esperado de pedidos entregados
        if (['entregado', 'entrega_parcial'].includes(parada.estado_entrega)) {
          montoEsperado += parada.pedido?.total || 0;
        }
        
        // Sumar cobros por tipo
        (parada.cobros || []).forEach(cobro => {
          if (cobro.medio_pago === 'efectivo') {
            montoEfectivoRegistrado += Number(cobro.monto);
          } else {
            montoOtros += Number(cobro.monto);
          }
        });
      });

      const montoTotalCobrado = montoEfectivoReal + montoOtros;
      const diferencia = montoTotalCobrado - montoEsperado;
      
      let tipoDiferencia: 'sin_diferencia' | 'sobrante' | 'faltante' = 'sin_diferencia';
      if (diferencia > 0.01) tipoDiferencia = 'sobrante';
      else if (diferencia < -0.01) tipoDiferencia = 'faltante';

      // Crear rendición
      const { data: rendicion, error: rendicionError } = await supabase
        .from('rendiciones')
        .insert({
          hoja_ruta_id: hojaRuta.id,
          monto_esperado: montoEsperado,
          monto_cobrado_efectivo: montoEfectivoReal,
          monto_cobrado_otros: montoOtros,
          monto_total_cobrado: montoTotalCobrado,
          diferencia: Math.abs(diferencia),
          tipo_diferencia: tipoDiferencia,
          observaciones,
        })
        .select()
        .single();

      if (rendicionError) throw rendicionError;

      // Actualizar estado de la hoja de ruta
      const { error: updateError } = await supabase
        .from('hoja_ruta')
        .update({ estado: 'completada' })
        .eq('id', hojaRuta.id);

      if (updateError) throw updateError;

      setHojaRuta({ ...hojaRuta, estado: 'completada' });
      toast.success('Ruta finalizada correctamente');
      
      return rendicion as Rendicion;
    } catch (err) {
      console.error('Error finalizando ruta:', err);
      toast.error('Error al finalizar la ruta');
      return null;
    }
  };

  useEffect(() => {
    loadHojaRutaDelDia();
  }, [loadHojaRutaDelDia]);

  return {
    hojaRuta,
    paradas,
    loading,
    error,
    refetch: loadHojaRutaDelDia,
    iniciarRuta,
    actualizarEstadoEntrega,
    registrarCobro,
    registrarDevolucion,
    finalizarRuta,
  };
};
