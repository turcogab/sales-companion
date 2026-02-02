import { useState, useEffect, useCallback } from 'react';
import { getSyncStatus, SyncStatus } from '@/lib/db';

export const useSyncStatus = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const syncStatus = await getSyncStatus();
      setStatus(syncStatus);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pendingCount = status
    ? status.pedidos.pendientes + status.cobranzas.pendientes
    : 0;

  return { status, loading, refresh, pendingCount };
};
