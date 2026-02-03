import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Package, Clock, CheckCircle2 } from 'lucide-react';
import { ChoferLayout } from '@/components/layout/ChoferLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useChoferData } from '@/hooks/useChoferData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ChoferHomePage = () => {
  const navigate = useNavigate();
  const { hojaRuta, paradas, loading, iniciarRuta } = useChoferData();

  const entregasCompletadas = paradas.filter(p => 
    ['entregado', 'entrega_parcial', 'rechazado', 'no_entregado'].includes(p.estado_entrega)
  ).length;
  
  const progreso = paradas.length > 0 
    ? Math.round((entregasCompletadas / paradas.length) * 100) 
    : 0;

  const totalCobrado = paradas.reduce((sum, p) => sum + (p.monto_cobrado || 0), 0);

  const handleIniciarRuta = async () => {
    const success = await iniciarRuta();
    if (success) {
      navigate('/chofer/ruta');
    }
  };

  if (loading) {
    return (
      <ChoferLayout title="Chofer">
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </ChoferLayout>
    );
  }

  if (!hojaRuta) {
    return (
      <ChoferLayout title="Chofer">
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <Truck className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-center">Sin ruta asignada</h2>
          <p className="text-muted-foreground text-center mt-2">
            No tienes una ruta de entrega asignada para hoy
          </p>
        </div>
      </ChoferLayout>
    );
  }

  return (
    <ChoferLayout title="Chofer">
      <div className="p-4 space-y-4">
        {/* Fecha y estado */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Ruta del día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {format(new Date(hojaRuta.fecha), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                hojaRuta.estado === 'en_progreso' 
                  ? 'bg-primary/10 text-primary'
                  : hojaRuta.estado === 'completada'
                  ? 'bg-success/10 text-success'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {hojaRuta.estado === 'pendiente' && 'Sin iniciar'}
                {hojaRuta.estado === 'en_progreso' && 'En progreso'}
                {hojaRuta.estado === 'completada' && 'Completada'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de entregas */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Progreso de entregas</span>
              <span className="text-sm text-muted-foreground">
                {entregasCompletadas} de {paradas.length}
              </span>
            </div>
            <Progress value={progreso} className="h-3" />
          </CardContent>
        </Card>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{paradas.length}</p>
              <p className="text-xs text-muted-foreground">Entregas totales</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{entregasCompletadas}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Total cobrado */}
        <Card className="shadow-card bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total cobrado</p>
                <p className="text-3xl font-bold text-primary">
                  ${totalCobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de acción principal */}
        {hojaRuta.estado === 'pendiente' && (
          <Button 
            className="w-full h-14 text-lg gradient-primary"
            onClick={handleIniciarRuta}
          >
            <Truck className="mr-2 h-5 w-5" />
            Iniciar Ruta
          </Button>
        )}

        {hojaRuta.estado === 'en_progreso' && (
          <div className="space-y-2">
            <Button 
              className="w-full h-12 gradient-primary"
              onClick={() => navigate('/chofer/ruta')}
            >
              <MapPin className="mr-2 h-5 w-5" />
              Ver ruta de entregas
            </Button>
            {entregasCompletadas === paradas.length && (
              <Button 
                variant="outline"
                className="w-full h-12 border-success text-success hover:bg-success/10"
                onClick={() => navigate('/chofer/rendicion')}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Realizar rendición
              </Button>
            )}
          </div>
        )}
      </div>
    </ChoferLayout>
  );
};
