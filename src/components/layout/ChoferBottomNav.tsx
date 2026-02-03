import { NavLink, useLocation } from 'react-router-dom';
import { Truck, MapPin, ClipboardCheck, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/chofer', icon: Truck, label: 'Inicio' },
  { path: '/chofer/ruta', icon: MapPin, label: 'Ruta' },
  { path: '/chofer/entregas', icon: ClipboardCheck, label: 'Entregas' },
  { path: '/chofer/rendicion', icon: Receipt, label: 'Rendición' },
];

export const ChoferBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || 
            (path !== '/chofer' && location.pathname.startsWith(path));
          
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1",
                "transition-colors duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-1",
                isActive && "stroke-[2.5px]"
              )} />
              <span className={cn(
                "text-xs",
                isActive && "font-semibold"
              )}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
