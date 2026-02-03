import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type UserRole = 'preventista' | 'chofer' | 'admin' | null;

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setUsuarioId(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, rol')
          .eq('user_id', user.id)
          .eq('activo', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
          setUsuarioId(null);
        } else if (data) {
          setRole(data.rol as UserRole);
          setUsuarioId(data.id);
        } else {
          // Usuario autenticado pero sin registro en tabla usuarios
          setRole(null);
          setUsuarioId(null);
        }
      } catch (err) {
        console.error('Error:', err);
        setRole(null);
        setUsuarioId(null);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserRole();
    }
  }, [user, authLoading]);

  return {
    role,
    usuarioId,
    loading: authLoading || loading,
    isChofer: role === 'chofer',
    isPreventista: role === 'preventista',
    isAdmin: role === 'admin',
  };
};
