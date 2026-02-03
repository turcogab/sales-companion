import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, UserRole } from '@/hooks/useUserRole';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  const loading = authLoading || roleLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Si se especifican roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Acceso denegado</h2>
            <p className="text-muted-foreground mb-4">
              No tienes permisos para acceder a esta sección.
              {role ? ` Tu rol actual es: ${role}` : ' No tienes un rol asignado.'}
            </p>
            <a href="/" className="text-primary hover:underline">
              Volver al inicio
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
