import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  CreditCard,
  FileCheck
} from 'lucide-react';
import { ChoferLayout } from '@/components/layout/ChoferLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useChoferData } from '@/hooks/useChoferData';
import { MEDIO_PAGO_LABELS, ESTADO_ENTREGA_LABELS } from '@/types/chofer';
import { cn } from '@/lib/utils';

export const RendicionPage = () => {
  const navigate = useNavigate();
  const { hojaRuta, paradas, finalizarRuta, loading } = useChoferData();
  
  const [efectivoReal, setEfectivoReal] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [rendicionResult, setRendicionResult] = useState<any>(null);

  // Calcular totales
  const entregasCompletadas = paradas.filter(p => 
    ['entregado', 'entrega_parcial'].includes(p.estado_entrega)
  );
  
  const totalEsperado = entregasCompletadas.reduce((sum, p) => 
    sum + (p.pedido?.total || 0), 0
  );

  let totalEfectivoRegistrado = 0;
  let totalOtros = 0;
  const cobrosPorMedio: Record<string, number> = {};

  paradas.forEach(parada => {
    (parada.cobros || []).forEach(cobro => {
      const monto = Number(cobro.monto);
      if (cobro.medio_pago === 'efectivo') {
        totalEfectivoRegistrado += monto;
      } else {
        totalOtros += monto;
      }
      cobrosPorMedio[cobro.medio_pago] = (cobrosPorMedio[cobro.medio_pago] || 0) + monto;
    });
  });

  const totalCobrado = totalEfectivoRegistrado + totalOtros;
  const pendienteCobrar = totalEsperado - totalCobrado;

  // Calcular diferencia cuando se ingresa efectivo real
  const efectivoRealNum = parseFloat(efectivoReal) || 0;
  const diferencia = efectivoRealNum - totalEfectivoRegistrado;

  const totalPendientes = paradas.filter(p => p.estado_entrega === 'pendiente').length;
  const totalDevoluciones = paradas.reduce((sum, p) => 
    sum + (p.devoluciones?.length || 0), 0
  );

  const handleFinalizarRuta = async () => {
    if (!efectivoReal) return;
    
    const result = await finalizarRuta(efectivoRealNum, observaciones);
    if (result) {
      setRendicionResult(result);
      setConfirmDialogOpen(false);
      setSuccessDialogOpen(true);
    }
  };

  const canFinalize = hojaRuta?.estado === 'en_progreso' && totalPendientes === 0;

  if (loading) {
    return (
      <ChoferLayout title="Rendición">
        <div className="p-4 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </ChoferLayout>
    );
  }

  if (!hojaRuta) {
    return (
      <ChoferLayout title="Rendición">
        <div className="p-4 text-center">
          <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay ruta activa para rendir</p>
        </div>
      </ChoferLayout>
    );
  }

  if (hojaRuta.estado === 'completada') {
    return (
      <ChoferLayout title="Rendición">
        <div className="p-4 text-center">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Ruta Completada</h2>
          <p className="text-muted-foreground mt-2">
            La rendición de esta ruta ya fue realizada
          </p>
        </div>
      </ChoferLayout>
    );
  }

  return (
    <ChoferLayout title="Rendición">
      <div className="p-4 space-y-4">
        {/* Advertencia si hay pendientes */}
        {totalPendientes > 0 && (
          <Card className="shadow-card bg-warning/10 border-warning/30">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0" />
              <div>
                <p className="font-medium text-warning">Entregas pendientes</p>
                <p className="text-sm text-muted-foreground">
                  Tienes {totalPendientes} entrega(s) sin completar. Debes finalizar todas las entregas antes de rendir.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen de entregas */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumen de Entregas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(ESTADO_ENTREGA_LABELS).map(([estado, label]) => {
              const count = paradas.filter(p => p.estado_entrega === estado).length;
              if (count === 0) return null;
              return (
                <div key={estado} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
            {totalDevoluciones > 0 && (
              <div className="flex justify-between items-center text-sm border-t pt-2">
                <span className="text-destructive">Devoluciones:</span>
                <span className="font-medium text-destructive">{totalDevoluciones}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de cobros */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumen de Cobros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total esperado:</span>
              <span className="font-semibold text-lg">
                ${totalEsperado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              {Object.entries(cobrosPorMedio).map(([medio, monto]) => (
                <div key={medio} className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2">
                    {medio === 'efectivo' ? (
                      <Wallet className="h-4 w-4 text-success" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-primary" />
                    )}
                    {MEDIO_PAGO_LABELS[medio as keyof typeof MEDIO_PAGO_LABELS]}:
                  </span>
                  <span className="font-medium">
                    ${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-medium">Total cobrado:</span>
              <span className="font-bold text-lg text-success">
                ${totalCobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {pendienteCobrar > 0 && (
              <div className="flex justify-between items-center bg-warning/10 p-2 rounded">
                <span className="text-warning font-medium">Pendiente de cobrar:</span>
                <span className="font-bold text-warning">
                  ${pendienteCobrar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rendición de efectivo */}
        {canFinalize && (
          <Card className="shadow-card border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Rendición de Efectivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Efectivo registrado en sistema</Label>
                <Input 
                  value={`$${totalEfectivoRegistrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                  disabled 
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label htmlFor="efectivoReal">Efectivo real a entregar</Label>
                <Input
                  id="efectivoReal"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={efectivoReal}
                  onChange={(e) => setEfectivoReal(e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>

              {efectivoReal && (
                <div className={cn(
                  "p-3 rounded-lg flex items-center justify-between",
                  diferencia === 0 
                    ? "bg-success/10" 
                    : diferencia > 0 
                    ? "bg-primary/10" 
                    : "bg-destructive/10"
                )}>
                  <span className="flex items-center gap-2">
                    {diferencia === 0 ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : diferencia > 0 ? (
                      <TrendingUp className="h-5 w-5 text-primary" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium">
                      {diferencia === 0 
                        ? 'Sin diferencia' 
                        : diferencia > 0 
                        ? 'Sobrante' 
                        : 'Faltante'}
                    </span>
                  </span>
                  <span className={cn(
                    "font-bold text-lg",
                    diferencia === 0 
                      ? "text-success" 
                      : diferencia > 0 
                      ? "text-primary" 
                      : "text-destructive"
                  )}>
                    ${Math.abs(diferencia).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div>
                <Label>Observaciones (opcional)</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales sobre la rendición..."
                  rows={3}
                />
              </div>

              <Button
                className="w-full h-14 text-lg gradient-primary"
                disabled={!efectivoReal}
                onClick={() => setConfirmDialogOpen(true)}
              >
                <FileCheck className="mr-2 h-5 w-5" />
                Finalizar Rendición
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog de confirmación */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Rendición</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de finalizar la ruta? Esta acción no se puede deshacer.
                
                <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Efectivo a entregar:</span>
                    <span className="font-bold">${efectivoRealNum.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Otros medios:</span>
                    <span className="font-bold">${totalOtros.toLocaleString('es-AR')}</span>
                  </div>
                  {diferencia !== 0 && (
                    <div className={cn(
                      "flex justify-between border-t pt-2",
                      diferencia > 0 ? "text-primary" : "text-destructive"
                    )}>
                      <span>{diferencia > 0 ? 'Sobrante:' : 'Faltante:'}</span>
                      <span className="font-bold">${Math.abs(diferencia).toLocaleString('es-AR')}</span>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleFinalizarRuta}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de éxito */}
        <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle className="h-6 w-6" />
                Rendición Completada
              </DialogTitle>
              <DialogDescription>
                La ruta ha sido finalizada correctamente.
              </DialogDescription>
            </DialogHeader>
            {rendicionResult && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total cobrado:</span>
                  <span className="font-bold">
                    ${Number(rendicionResult.monto_total_cobrado).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Diferencia:</span>
                  <span className={cn(
                    "font-bold",
                    rendicionResult.tipo_diferencia === 'sobrante' 
                      ? "text-primary" 
                      : rendicionResult.tipo_diferencia === 'faltante'
                      ? "text-destructive"
                      : "text-success"
                  )}>
                    {rendicionResult.tipo_diferencia === 'sin_diferencia' 
                      ? 'Sin diferencia' 
                      : `${rendicionResult.tipo_diferencia === 'sobrante' ? '+' : '-'}$${Number(rendicionResult.diferencia).toLocaleString('es-AR')}`
                    }
                  </span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => navigate('/chofer')}>
                Volver al inicio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ChoferLayout>
  );
};
