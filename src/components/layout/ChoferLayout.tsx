import { ReactNode } from 'react';
import { Header } from './Header';
import { ChoferBottomNav } from './ChoferBottomNav';

interface ChoferLayoutProps {
  children: ReactNode;
  title: string;
  showNav?: boolean;
}

export const ChoferLayout = ({ children, title, showNav = true }: ChoferLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} />
      <main className="flex-1 pb-20 overflow-auto">
        {children}
      </main>
      {showNav && <ChoferBottomNav />}
    </div>
  );
};
