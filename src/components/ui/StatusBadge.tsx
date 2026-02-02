import { cn } from '@/lib/utils';
import { Check, Clock, AlertCircle, Truck } from 'lucide-react';

type Status = 'pendiente' | 'sincronizado' | 'procesado' | 'entregado';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; icon: typeof Check; className: string }> = {
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  sincronizado: {
    label: 'Sincronizado',
    icon: Check,
    className: 'bg-success/10 text-success border-success/20',
  },
  procesado: {
    label: 'Procesado',
    icon: AlertCircle,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  entregado: {
    label: 'Entregado',
    icon: Truck,
    className: 'bg-accent/10 text-accent border-accent/20',
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};
