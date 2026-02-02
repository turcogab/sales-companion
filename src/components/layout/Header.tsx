import { Wifi, WifiOff, RefreshCw, Menu } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export const Header = ({ title, onMenuClick, showMenu = true }: HeaderProps) => {
  const isOnline = useOnlineStatus();
  const { pendingCount, refresh } = useSyncStatus();

  return (
    <header className="gradient-header text-primary-foreground sticky top-0 z-50 safe-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showMenu && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="bg-warning text-warning-foreground text-xs font-medium px-2 py-1 rounded-full">
              {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
            </span>
          )}

          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
              isOnline
                ? "bg-success/20 text-success-foreground"
                : "bg-destructive/20 text-destructive-foreground"
            )}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>

          {isOnline && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refresh()}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
