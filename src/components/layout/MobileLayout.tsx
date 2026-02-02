import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  showNav?: boolean;
}

export const MobileLayout = ({ children, title, showNav = true }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} />
      <main className="flex-1 pb-20 overflow-auto">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};
